'use strict';

const schema = Joi.object().keys({
  name: Joi.string().required()
});
joiToForm('formFields',schema);
