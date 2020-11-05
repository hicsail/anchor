const joiToJson = function(joiSchema) {	
	let jsonSchema = {};	
	if (joiSchema['_type'] === 'object') {		
		jsonSchema['type']	= 'object';
		jsonSchema['properties'] = {};		
		for (let child of joiSchema['_inner'].children) {
			jsonSchema['properties'][child.key]	= {};
			if (child['schema']['_type'] === 'string') {
				jsonSchema['properties'][child.key]['type'] = 'string';
				jsonSchema['properties'][child.key]['properties'] = stringJoiToJSON(child['schema']);	
			}
			else if (child['schema']['_type'] === 'number') {
				jsonSchema['properties'][child.key]['type'] = 'number';
				jsonSchema['properties'][child.key]['properties'] = numberJoiToJSON(child['schema']);	
			}
			else if (child['schema']['_type'] === 'date') {
				jsonSchema['properties'][child.key]['type'] = 'date';
				jsonSchema['properties'][child.key]['properties'] = dateJoiToJSON(child['schema']);	
			}
			else if (child['schema']['_type'] === 'boolean') {
				jsonSchema['properties'][child.key]['type'] = 'boolean';
				jsonSchema['properties'][child.key]['properties'] = booleanJoiToJSON(child['schema']);	
			}
		}
	}
	return jsonSchema;	
}

const stringJoiToJSON = function(stringJoi) {
	let result = {}
	if(stringJoi['_flags'].presence === 'required'){
		result['required'] = true;
	}
	if(stringJoi['_flags'].case === 'lowercase') {
		result['lowercase'] = true;	
	}
	for (let test of stringJoi['_tests']) {
		if(test.name === 'email'){
			result['email'] = true;
		}
		if(test.name === 'lowercase'){
			result['lowercase'] = true;
		}
		if(test.name === 'min'){
			result['min'] = test.arg;
		}
		if(test.name === 'max') {
			result['max'] = test.arg;
		}
		if(test.name === 'token') {
			result['token'] = true;
		}
	}
	return result;
}

const numberJoiToJSON = function(numberJoi) {
	let result = {}
	if(numberJoi['_flags'].presence === 'required'){
		result['required'] = true;
	}
	for (let test of numberJoi['_tests']) {
		if(test.name === 'greater'){
			result['greater'] = test.arg;
		}
		if(test.name === 'less'){
			result['less'] = test.arg;
		}
		if(test.name === 'min'){
			result['min'] = test.arg;
		}
		if(test.name === 'max') {
			result['max'] = test.arg;
		}
		if(test.name === 'multiple') {
			result['multiple'] = test.arg;
		}
		if(test.name === 'precision') {
			result['precision'] = test.arg;
		}
		if(test.name === 'integer') {
			result['integer'] = true;
		}
		if(test.name === 'negative') {
			result['negative'] = true;
		}
		if(test.name === 'positive') {
			result['positive'] = true;
		}
		if(test.name === 'port') {
			result['port'] = true;
		}
	}
	return result;
}

const dateJoiToJSON = function(dateJoi) {
	let result = {}
	if(dateJoi['_flags'].presence === 'required'){
		result['required'] = true;
	}
	for (let test of dateJoi['_tests']) {
		if(test.name === 'greater'){
			result['greater'] = test.arg;
		}
		if(test.name === 'less'){
			result['less'] = test.arg;
		}
		if(test.name === 'min'){
			result['min'] = test.arg;
		}
		if(test.name === 'max') {
			result['max'] = test.arg;
		}
		if(test.name === 'iso') {
			result['iso'] = true;
		}	
	}
	return result;
}

const booleanJoiToJSON = function(booleanJoi) {
	let result = {}
	if(booleanJoi['_flags'].presence === 'required'){
		result['required'] = true;
	}	
	return result;
}

module.exports = joiToJson;