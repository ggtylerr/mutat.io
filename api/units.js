var { create, all } = require('mathjs');
const math = create(all);
const error = require('./error');

module.exports = {
  convert: function (p) {
    // Config math.js
    math.config({ number: 'BigNumber', precision: 64 });
    // Get rates
    var json = {};
    try {
      json = require('../public/unit_rates.json');
    } catch (err) {
      console.error(`Error occurred while trying to read the Unit Rates JSON from an API request!\nOccurred from: Unit Convert function in API\n${err}`);
      return {
        "err":"Error occurred while trying to read the Unit Rates JSON! *This is a host issue. Don't worry, you're probably not at fault.*",
        "data":err
      };
    }
    // Get type
    if (!(typeof p.type === 'string')) {
      // Type is not included or isn't a string
      return error.def("Type is not a string or undefined! Type is a required variable!",new Error().stack);
    }
    if (!json.hasOwnProperty(p.type)) {
      // Type is not valid
      return error.def("Type is not valid!",new Error().stack);
    }
    var type = p.type;
    // Get from/to values
    if ((p.from === undefined && !(typeof p.fromSym === 'string')) || (!(typeof p.from === 'string') && p.fromSym === undefined)) {
      // From value isn't defined / wrong type
      return error.def("From value is not a string or undefined! From is a required value!",new Error().stack);
    }
    if ((p.to === undefined && !(typeof p.toSym === 'string')) || (!(typeof p.to === 'string') && p.toSym === undefined)) {
      // To value isn't defined / wrong type
      return error.def("To value is not a string or undefined! To is a required value!",new Error().stack);
    }
    var fr = {};
    if (!json[type].hasOwnProperty(p.from) && p.fromSym === undefined) {
      // From value is not valid and not using symbol
      return error.def("From value is not valid!",new Error().stack);
    } else if (p.fromSym === undefined) {
      fr = json[type][p.from];
      fr.type = p.from;
    }
    if (p.fromSym != undefined) {
      var found = false;
      Object.keys(json[type]).forEach(function(k){
        if (json[type][k].s == p.fromSym) {
          found = true;
          fr = json[type][k];
          fr.type = k;
        }
      });
      // From value is not valid and using symbol
      if (!found) return error.def("From value is not valid!",new Error().stack);
    }
    var to = {};
    if (!json[type].hasOwnProperty(p.to) && p.toSym === undefined) {
      // To value is not valid and not using symbol
      return error.def("To value is not valid!",new Error().stack);
    } else if (p.toSym === undefined) {
      to = json[type][p.to];
      to.type = p.to;
    }
    if (p.toSym != undefined) {
      var found = false;
      Object.keys(json[type]).forEach(function(k){
        if (json[type][k].s == p.toSym) {
          found = true;
          to = json[type][k];
          to.type = k;
        }
      });
      // To value is not valid and using symbol
      if (!found) return error.def("To value is not valid!",new Error().stack);
    }
    // Check if amount exists
    if (!(typeof p.amount === 'number')) return error.def("Amount is not a number or undefined! The amount is a required value!",new Error().stack);
    // Convert
    var conv = math.bignumber(0);
    var units = json[type];
    // TODO: Add support for 'from' prefixes
    // Convert to SI
    conv = p.amount;
    if (fr.type !== units["__si"]) {
      if (!(fr.f == undefined)) {
        // Factor conversion
        conv = math.multiply(conv,math.bignumber(fr.f));
      } else {
        // Expression conversion
        conv = math.evaluate(fr.e,{x:conv});
      }
    }
    // Convert to 'to'
    if (!(to.f == undefined)) {
      // Factor conversion
      conv = math.divide(conv,math.bignumber(to.f));
    } else {
      // Expression conversion
      conv = math.evaluate(to.t,{x:conv});
    }
    // TODO: Add support for 'to' prefixes
    return {value:math.string(conv)};
  }
}