const json = {
    type: 'object',
    properties: {
        firstName: {          
            type: 'string',
            properties: {
            	required: true,
            	//lowercase:true,
            	min: 5,
            	max:10,
            	//description: 'First name.',	
            }
        },
        email: {          
            type: 'string',
            properties: {
            	required: true,
            	lowercase:true,
            	email:true	
            }
        },
        username: {          
            type: 'string',
            properties: {
            	required: true,
            	lowercase:true,
            	token:true	
            }
        },
        counts: {
        	type: 'number',
        	properties: {
        		greater: 10,
        		less: 20,
        		multiple: 3
        	}
        },
        date: {
        	type: 'date'
        	/*properties: {
        		greater: 10     		
        	}*/	
        },
        arezoo: {
        	type: 'boolean'
        }
    }    
}

const stringConverter= function(props, result) {
	if (props.length === 0){		
		return result;	
	}    
    prop = props.pop();

	if (prop['min']){
		result = result.min(prop['min']);							
	}
	else if (prop['max']){
		result = result.max(prop['max']);
	}
	else if (prop['lowercase']) {
		result = result.lowercase();
	}
	else if (prop['required']) {
		result = result.required();
	}
	else if (prop['email'])	{
		result = result.email();
	}
	else if (prop['token'])	{
		result = result.token();
	}
	return stringConverter(props, result);		
}

const numberConverter= function(props, result) {
	if (props.length === 0){		
		return result;	
	}    
    prop = props.pop();

	if (prop['greater']){
		result = result.greater(prop['greater']);							
	}
	else if (prop['integer']){
		result = result.integer();
	}
	else if (prop['less']) {
		result = result.less(prop['less']);
	}
	else if (prop['max']) {
		result = result.max(prop['max']);
	}
	else if (prop['min'])	{
		result = result.min(prop['min']);
	}
	else if (prop['multiple'])	{
		result = result.multiple(prop['multiple']);
	}
	else if (prop['negative']) {
		result = result.negative();
	}
	else if (prop['positive'])	{
		result = result.positive();
	}
	else if (prop['port'])	{
		result = result.port();
	}
	else if (prop['precision'])	{
		result = result.precision(prop['precision']);
	}
	return numberConverter(props, result);		
}

const dateConverter= function(props, result) {
	if (props.length === 0){		
		return result;	
	}    
    prop = props.pop();

	if (prop['greater']){
		result = result.greater(prop['greater']);							
	}	
	else if (prop['less']) {
		result = result.less(prop['less']);
	}
	else if (prop['max']) {
		result = result.max(prop['max']);
	}
	else if (prop['min'])	{
		result = result.min(prop['min']);
	}
	else if (prop['iso'])	{
		result = result.iso();
	}	
	return dateConverter(props, result);		
}

const booleanConverter= function(props, result) {
	if (props.length === 0){		
		return result;	
	}    
    prop = props.pop();
	
	return booleanConverter(props, result);		
}

const convert = function(jsonSchema) {
	
	if (jsonSchema['type'] === 'object') {
		let obj = {};
		for (let prop in jsonSchema['properties']) {			
			obj[prop] = convert(jsonSchema['properties'][prop]);			
		}		
		return Joi.object(obj);
	}
	let properties = [];
	for (let prop in jsonSchema['properties']) {
		let item = {};
		item[prop] = jsonSchema['properties'][prop];
		properties.push(item);
	}	
	if (jsonSchema['type'] === 'string') {			
		return (stringConverter(properties, Joi.string()));
	}
	if (jsonSchema['type'] === 'number') {			
		return (numberConverter(properties, Joi.number()));
	}
	if (jsonSchema['type'] === 'date') {			
		return (dateConverter(properties, Joi.date()));
	}
	if (jsonSchema['type'] === 'boolean') {			
		return (booleanConverter(properties, Joi.boolean()));
	}
}

let schema = convert(json);