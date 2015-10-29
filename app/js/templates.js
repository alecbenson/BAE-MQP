/**
 * All partial views used within handlebar templates should be registered in this function *
 **/
function registerAllPartials() {
  registerExternalPartial("sourceUpload");
  registerExternalPartial("modelUpload");
  registerExternalPartial("sourceList");
  registerExternalPartial("datepicker");
  registerExternalPartial("numberpicker");
}

/**
 * Registers a partial template with handlebar js. This is must be called for every template
 * that is being used within another handlebar template.
 * @param name - the name that the template is referred to with
 */
function registerExternalPartial(name) {
  $.get('/templates/' + name + '.hbs', function(src) {
    Handlebars.registerPartial(name, src);
  });
}

/**
 * Retrieves a template from the templates directory with the given filename.
 * Should be used as a deferred object.
 * Note that $.get caches the result, so it's okay to make subsequent calls
 * to retrieve the same template.
 * @param name - the filename of the template to retrieve. Do not include file extension.
 * @return a string containing the template
 */
function getTemplateHTML(name) {
  var d = $.Deferred();
  $.get('/templates/' + name + '.hbs', function(src) {
    d.resolve(src);
  });
  return d.promise();
}

/**
 *Applies a context to a handlebar tempalte
 * @param context - the parameters to pass to the template
 * @return the templated file with substitutions
 **/
function applyTemplate(src, context) {
  return Handlebars.compile(src)(context);
}
