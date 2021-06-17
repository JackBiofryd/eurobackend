const express = require('express');
const cors = require('cors');
const Grid = require('gridfs-stream');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const GridFsStorage = require('multer-gridfs-storage').GridFsStorage;
const app = express();

const PORT = 5000;
const mongoURI =
	'mongodb://MeDev:XFDitxWin6kr0BEY@cluster0-shard-00-00.uxfgg.mongodb.net:27017,cluster0-shard-00-01.uxfgg.mongodb.net:27017,cluster0-shard-00-02.uxfgg.mongodb.net:27017/europlusproekt?ssl=true&replicaSet=atlas-o627eq-shard-0&authSource=admin&retryWrites=true&w=majority';

// MULTER
const storage = new GridFsStorage({
	url: mongoURI,
	file: (req, file) => {
		return new Promise((resolve, reject) => {
			resolve({
				filename: `${req.params.workType}-${
					path.parse(file.originalname).name
				}-${Date.now()}${path.extname(file.originalname)}`,
				bucketName: 'uploads'
			});
		});
	}
});

const upload = multer({
	fileFilter: (req, file, callback) => {
		const extention = path.extname(file.originalname);
		if (!['.png', '.jpg', '.jpeg', '.PNG'].includes(extention))
			return callback(new Error('Please select only valid images'));
		callback(null, true);
	},
	storage
});

// MONGO FILE UPLOAD
// Create mongo connection
const connection = mongoose.createConnection(mongoURI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true
});
// Init grid fs stream
let gfs;

connection.once('open', () => {
	// Init stream
	gfs = Grid(connection.db, mongoose.mongo);
	gfs.collection('uploads');
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/upload/:workType', upload.single('image'), async (req, res) => {
	if (!req.file)
		return res.status(400).json({ msg: 'Please Select A File!' });

	const { password, email } = req.body;

	if (email !== 'jackbiofryd@gmail.com' || password !== '123456') {
		gfs.remove(
			{ filename: req.file.filename, root: 'uploads' },
			(err, gridStore) => console.error(err)
		);
		return res
			.status(401)
			.json({ msg: 'Invalid Credentials. Please Try Again.' });
	}

	res.json({ msg: 'File Uploaded!' });
});

app.get('/getImages/:workType', async (req, res) => {
	const { workType } = req.params;

	const collection = connection.collection('uploads.files');
	const allFiles = await collection.find().toArray();

	const files = allFiles.filter(
		file => file.filename.split('-')[0] === workType
	);

	const fileNames = files.map(file => file.filename);

	res.json({ files: fileNames });
});

app.get('/image/:fileName', (req, res, next) => {
	const { fileName } = req.params;

	gfs.files.findOne({ filename: fileName }, (err, file) => {
		if (err)
			return res
				.status(500)
				.json({ msg: 'Unknown Internal Server Error Occured.' });

		if (!file) return res.status(404).json({ msg: 'Image not found' });

		// Send file to browser
		const readstream = gfs.createReadStream(file.filename);
		readstream.pipe(res);
	});
});

app.post('/deleteImage/:fileName', (req, res) => {
	const { email, password } = req.body;

	if (email !== 'jackbiofryd@gmail.com' || password !== '123456') {
		return res.status(401).json({ msg: 'Invalid Credentials.' });
	}
	console.log(req.params.fileName);
	gfs.remove(
		{ filename: req.params.fileName, root: 'uploads' },
		(err, gridStore) => {
			if (err)
				return res
					.status(500)
					.json({ msg: 'An Error Occurred. Please Try Again.' });
			res.json({ msg: 'File Deleted!' });
		}
	);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.listen(process.env.PORT || PORT, () =>
	console.log(`Listening on *:${PORT}`)
);
