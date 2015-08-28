var levelup = require('levelup');

var writeReadData = function(db){
	db.put('foo', 'bar');
	db.get('foo', function(err, value) {
	  console.log("foo: " + value);
	});

	db.batch([
	      { type: 'put', key: 'spouse', value: 'Ri Sol-ju' }
	    , { type: 'put', key: 'dob', value: '8 January 1983' }
	    , { type: 'put', key: 'occupation', value: 'Clown' }
	  ]);
	db.get('occupation', function(err, data) {
	  console.log("occupation: " + data);
	});
};

var testLevelUpBackend = function(levelupBackendName, dbDir){
	var levelupBackend = require(levelupBackendName);
	console.log("dbDir for jsondown: " + dbDir);
	var db = levelup(dbDir, { db: levelupBackend});
	writeReadData(db);
};

exports.testLevelUpBackends = function() {

	// testing jsondwon backend
	testLevelUpBackend('jsondown', __dirname + '/unicorndata.json')

	// testing level-fs backend
	//testLevelUpBackend('level-fs', __dirname + '/db')

};

