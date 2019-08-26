'use strict';
const conf = require('ocore/conf');
const objectHash = require('ocore/object_hash.js');
const countries = require("i18n-iso-countries");
const eventBus = require('ocore/event_bus.js');

const documents = {
	lemmy: {
		status: "APPROVED_VERIFIED",
		firstName: "LEMMY",
		lastName: "KILMISTER",
		dob: "1945-12-24",
		gender: "M",
		issuingCountry: "USA",
		usState: "NY",
		number: "987654321",
		type: "PASSPORT",
		idSubType: "E_PASSPORT",
		clientIp: "127.0.0.1"
	},
	lemmy_drivers_license: {
		status: "APPROVED_VERIFIED",
		firstName: "LEMMY",
		lastName: "KILMISTER",
		dob: "1945-12-24",
		gender: "M",
		issuingCountry: "USA",
		usState: "NY",
		number: "B123123",
		type: "DRIVING_LICENSE",
		clientIp: "127.0.0.1"
	},
	joe: {
		status: "APPROVED_VERIFIED",
		firstName: "JOE",
		lastName: "BLACK",
		dob: "1906-06-06",
		gender: "M",
		issuingCountry: "USA",
		usState: "CA",
		number: "666999666",
		type: "PASSPORT",
		idSubType: "E_PASSPORT",
		clientIp: "127.0.0.1"
	},
	joe_drivers_license: {
		status: "APPROVED_VERIFIED",
		firstName: "JOE",
		lastName: "BLACK",
		dob: "1906-06-06",
		gender: "M",
		issuingCountry: "USA",
		usState: "CA",
		number: "A111222333",
		type: "DRIVING_LICENSE",
		idSubType: "LEARNING_DRIVING_LICENSE",
		clientIp: "127.0.0.1"
	},
	jimi: {
		status: "APPROVED_VERIFIED",
		firstName: "JIMI",
		lastName: "HENDRIX",
		dob: "1942-11-27",
		gender: "M",
		issuingCountry: "USA",
		usState: "WA",
		number: "B111222333",
		type: "DRIVING_LICENSE",
		clientIp: "127.0.0.1"
	},
	iggy: {
		status: "APPROVED_VERIFIED",
		firstName: "IGGY",
		lastName: "POP",
		dob: "1947-04-21",
		gender: "M",
		issuingCountry: "USA",
		usState: "MI",
		number: "I222333444",
		type: "DRIVING_LICENSE",
		clientIp: "127.0.0.1"
	},

};

function mockJumioResponse(document){
	return {
		transaction: {
			status: "DONE"
		},
		document: document,
		verification: {
			identityVerification: {
				similarity: "MATCH",
				validity: "TRUE"
			}
		}
	};
}

function convertRestResponseToCallbackFormat(body){
	let data = {
		idScanStatus: body.transaction.status,
		verificationStatus: body.document.status,
		idFirstName: body.document.firstName,
		idLastName: body.document.lastName,
		idDob: body.document.dob,
		gender: body.document.gender,
		idCountry: body.document.issuingCountry,
		idUsState: body.document.usState,
		idNumber: body.document.number,
		idType: body.document.type,
		idSubtype: body.document.idSubtype,
		clientIp: body.transaction.clientIp
	};
	if (body.verification)
		data.identityVerification = body.verification.identityVerification;
	return data;
}

function convertCountry3to2(country3){
	let country2 = countries.alpha3ToAlpha2(country3);
	if (!country2)
		throw Error("no 2-letter country code of "+country3);
	return country2;
}

function getUserId(profile){
	let shortProfile = {
		first_name: profile.first_name,
		last_name: profile.last_name,
		dob: profile.dob,
		country: profile.country,
		//	id_number: profile.id_number
	};
	return objectHash.getBase64Hash([shortProfile, conf.salt], true);
}

function getAttestationPayloadAndSrcProfile(user_address, data, bPublic){
	let cb_data = convertRestResponseToCallbackFormat(data);
	let profile = {
		first_name: cb_data.idFirstName,
		last_name: cb_data.idLastName,
		dob: cb_data.idDob,
		country: convertCountry3to2(cb_data.idCountry),
		us_state: cb_data.idUsState,
		id_number: cb_data.idNumber,
		id_type: cb_data.idType,
		id_subtype: cb_data.idSubtype
	};
	console.log(profile);
	Object.keys(profile).forEach(function(key){
		if (!profile[key])
			delete profile[key];
	});
	console.log(profile);
	if (bPublic){
		//	throw "public";
		profile.user_id = getUserId(profile);
		let attestation = {
			address: user_address,
			profile: profile
		};
		return [attestation, null];
	}
	else{
		var [public_profile, src_profile] = hideProfile(profile);
		let attestation = {
			address: user_address,
			profile: public_profile
		};
		return [attestation, src_profile];
	}
}

function hideProfile(profile){
	let composer = require('ocore/composer.js');
	let hidden_profile = {};
	let src_profile = {};
	for (let field in profile){
		let value = profile[field];
		let blinding = composer.generateBlinding();
		let hidden_value = objectHash.getBase64Hash([value, blinding], true);
		hidden_profile[field] = hidden_value;
		src_profile[field] = [value, blinding];
	}
	let profile_hash = objectHash.getBase64Hash(hidden_profile, true);
	let user_id = getUserId(profile);
	let public_profile = {
		profile_hash: profile_hash,
		user_id: user_id
	};
	return [public_profile, src_profile];
}


function postAttestation(attestor_address, payload, onDone) {
	function onError(err) {
		onDone(err);
	}

	var network = require('ocore/network.js');
	var composer = require('ocore/composer.js');
	let headlessWallet = require('headless-obyte');
	let objMessage = {
		app: "attestation",
		payload_location: "inline",
		payload_hash: objectHash.getBase64Hash(payload, true),
		payload: payload
	};

	let params = {
		paying_addresses: [attestor_address],
		outputs: [{address: attestor_address, amount: 0}],
		messages: [objMessage],
		signer: headlessWallet.signer,
		callbacks: composer.getSavingCallbacks({
			ifNotEnoughFunds: onError,
			ifError: onError,
			ifOk: function (objJoint) {
				network.broadcastJoint(objJoint);
				onDone(null, objJoint.unit.unit);
			}
		})
	};

	let timestamp = Date.now();
	let datafeed = {timestamp: timestamp};
	let objTimestampMessage = {
		app: "data_feed",
		payload_location: "inline",
		payload_hash: objectHash.getBase64Hash(datafeed, true),
		payload: datafeed
	};
	params.messages.push(objTimestampMessage);

	composer.composeJoint(params);
}


function postAndWriteAttestation(device_address, attestor_address, attestation_payload, src_profile) {
	postAttestation(attestor_address, attestation_payload, (err, unit) => {
		if (err) return console.error(err);

		let device = require('ocore/device.js');
		let text = "Now your real name is attested, see the attestation unit: https://testnetexplorer.obyte.org/#" + unit;
		if (src_profile) {
			let private_profile = {
				unit: unit,
				payload_hash: objectHash.getBase64Hash(attestation_payload, true),
				src_profile: src_profile
			};
			let base64PrivateProfile = Buffer.from(JSON.stringify(private_profile)).toString('base64');
			text += "\n\nClick here to save the profile in your wallet: [private profile](profile:" + base64PrivateProfile + ").  You will be able to use it to access the services that require a proven identity.";
		}

		device.sendMessageToDevice(device_address, 'text', text);
	});
}


const headlessWallet = require('headless-obyte');

eventBus.once('headless_wallet_ready', () => {
	headlessWallet.issueOrSelectAddressByIndex(0, 0, realNameAttestor => {
		console.log('== real name attestation address: ' + realNameAttestor);

		eventBus.on('text', (device_address, user_address) => {
			const mockRealName = mockJumioResponse(documents['iggy']);
			let attestation, src_profile;
			[attestation, src_profile] = getAttestationPayloadAndSrcProfile(user_address.trim(), mockRealName, false);
			postAndWriteAttestation(device_address, realNameAttestor, attestation, src_profile);
		});
	});
});
