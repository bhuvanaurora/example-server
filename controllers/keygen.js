//var NodeRSA = require('node-rsa');
//var key = new NodeRSA({b: 512});

var bluePromise = require('bluebird').Promise;
var fs = bluePromise.promisifyAll(require('fs'));
var path = require('path');
var ursa = require('ursa');
var mkdirpAsync = bluePromise.promisify(require('mkdirp'));
var Keypair = require('../models/Keypair');


exports.index = (req, res) => {
	var key = ursa.generatePrivateKey(1024, 65537);
	var privatepemkey = key.toPrivatePem();
	var publicpemkey = key.toPublicPem();

	if(!req.query.name) return res.json({'message':'Name required in query'});

	var pathname = './genKeys/' + req.query.name;
	var privatekey = path.join(pathname, 'privkey.pem');
    var publickey = path.join(pathname, 'pubkey.pem');

	Keypair.findOne({'name': req.query.name}, (err, existingKey) => {
		if(existingKey) return res.json({'message':'You have already generated the key ' + req.query.name});	

		mkdirpAsync(pathname).then(function () {
		bluePromise.all([
		  fs.writeFileAsync(privatekey, privatepemkey, 'ascii')
			, fs.writeFileAsync(publickey, publicpemkey, 'ascii')
		  ]);
		}).then(function () {
			var keypair = new Keypair({
				'name': req.query.name,
				'keyD': false
			});
			keypair.save((err) => {
				if(err) return res.json(err);
				return res.json({'message':'Key generation successful'});
			});
		});
	});
};


exports.downloadPrivateKey = (req, res) => {
	var name = req.query.name;	
	Keypair.findOne({'name': name}, (err, existingKey) => {
		if(err) return res.json({'message': 'Some error occurred'});
		if(!existingKey) return res.json({'message': 'You need to generate a key first'});
		if(existingKey.keyD) return res.json({'message': 'You have downloaded the private key already.'});

		var filePath = './genKeys/' + name + '/privkey.pem';

		existingKey.keyD = true;
		existingKey.save((err) => {
			if(err) return res.json(err);
			return res.download(filePath);
		});
	});
}
