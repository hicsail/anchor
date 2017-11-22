'use strict';

const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  username: Joi.string().token().lowercase().required()
});
joiToForm('formFields',schema);
