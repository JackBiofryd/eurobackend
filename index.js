const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const { workType } = req.params;
		const dir = `./uploads/${workType}`;

		return cb(null, dir);
	},
	filename: (req, file, cb) => {
		console.log(file);
		cb(
			null,
			`${
				path.parse(file.originalname).name
			}--${Date.now()}.${path.extname(file.originalname)}`
		);
	}
});
const upload = multer({ storage });

const PORT = 5000;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.send('Welcome!'));

app.get('/getImages/:imageType', (req, res) => {
	fs.readdir(`./uploads/${req.params.imageType}`, (err, files) => {
		return res.json({ files });
	});
});

const handleUpload = (req, res) => {
	if (!req.file)
		return res.status(400).json({ msg: 'Please Select an Image' });

	if (
		req.body.email !== 'jackbiofryd@gmail.com' ||
		req.body.password !== '123456'
	)
		return res.status(401).json('Invalid Credentials, Log in Again');

	return res.json({ msg: 'Success! File Uploaded.' });
};

// SSL Verification
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

app.post('/upload/:workType', upload.single('image'), handleUpload);

app.listen(process.env.PORT || PORT, () =>
	console.log(`Listening on *:${PORT}`)
);
