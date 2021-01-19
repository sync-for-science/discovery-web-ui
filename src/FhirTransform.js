// import jsonQuery from 'json-query';  // Doesn't work with Chrome devtools (for some reason)
const jsonQuery = require('json-query');

export default class FhirTransform {
  constructor(data, template) {
    this.initial = data;
    this.template = template;
    this.transformed = FhirTransform.transform(data, template);
  }

  get transformedData() {
    return this.transformed;
  }

  pathItem(path, options) {
    return FhirTransform.getPathItem(this.transformed, path, options);
  }

  // Walk the template, creating a copy and replacing functions (that refer to 'data') with their return values
  static transform(data, template) {
    if (template instanceof Function) {
      // invoke the function on the data
      return template(data);
    }
    if (template instanceof Array) {
      // iterate over array members
      const arr = [];
      for (const elt of template) {
        arr.push(FhirTransform.transform(data, elt));
      }
      return arr;
    }
    if (template === null || !(template instanceof Object)) {
      // return primitive types
      return template;
    }
    // iterate over object properties
    const obj = {};
    for (const prop in template) {
      obj[prop] = FhirTransform.transform(data, template[prop]);
    }
    return obj;
  }

  //
  // Walk an object/array and returns the value at the end of the provided path specification.
  // See https://www.npmjs.com/package/json-query
  //
  static getPathItem(obj, path, options) {
    return jsonQuery(path, { data: obj, ...options }).value;
  }
}
