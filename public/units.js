function updateUnits(type) {
  // Clear previous options
  $("#from-select").empty();
  $("#to-select").empty();
  // Clear and hide prefixes
  $("#from-prefix-select").hide();
  $("#from-prefix-select").removeClass("halfwidth");
  $("#from-select").removeClass("halfwidth");
  $("#from-prefix-select").empty();
  $("#to-prefix-select").hide();
  $("#to-prefix-select").removeClass("halfwidth");
  $("#to-select").removeClass("halfwidth");
  $("#to-prefix-select").empty();
  // Get units
  $.getJSON('/unit_rates.json',function(json) {
    var units = json[type];
    // Set options
    for (x in units) {
      if (!x.startsWith("__")) {
        let v = x;
        if (x.startsWith("*")) x = x.substring(1);
        var o = new Option(x,v);
        $(o).html(x).attr('label',x);
        $('#from-select').append(o);
        var t = new Option(x,v);
        $(t).html(x).attr('label',x);
        $('#to-select').append(t);
      }
    }
    // Select default
    if (units['__defaultFrom'] != undefined) 
      $("#from-select").val(units['__defaultFrom']);
    else $("#from-select").val(units['__si']);
    $("#to-select").val(units['__defaultTo']);
  });
}

function convertUnits(reverse=false) {
  // Config math
  math.config({ number: 'BigNumber', precision: 64 })
  // Get units
  $.getJSON('/unit_rates.json',function(json) {
    var units = json[$('#selected').text().substr(1)];
    // Get selected units
    var fromUnit = $('#from-select').val();
    var toUnit = $('#to-select').val();
    // Get value
    var fromValue = $('#from').val();
    // Reverse if needed
    if (reverse) {
      var t = fromUnit;
      fromUnit = toUnit;
      toUnit = t;
      fromValue = $('#to').val();
    }
    // Clean value
    c = fromValue.replace(/[^\d.-]/g,'');
    c = c.replace(/(?!^)-/g,'');
    c = c.split(/\.(.+)/g,2);
    if (c[1] != undefined) c[1] = c[1].replace(/\./g,'');
    c = c.join(".");
    if (c.slice(-1) == '.') c = c.slice(0,-1);
    if (c == "" || c.replace(/\D/g,'') == "") c = "0";
    fromValue = math.bignumber(c);
    // Prepare equation string
    var equation = "$$\\displaylines{";
    var step = 1;
    // Convert value to base (if prefix)
    var converted = math.bignumber(0);
    if (units[fromUnit].p != undefined) {
      var p = "";
      if (!reverse) p = $("#from-prefix-select").val();
      else p = $('#to-prefix-select').val();
      if (p != "(no prefix)") {
        if (json["__prefix"][units[fromUnit].p][p].f != undefined) {
          var f = json["__prefix"][units[fromUnit].p][p].f;
          converted = math.multiply(fromValue,math.bignumber(f));
          equation += `\\text{${step}. Apply prefix}\\\\${sh(fromValue)}\\times${sh(f)}=${sh(converted)}\\\\`;
          step += 1;
        } else {
          var e = json["__prefix"][units[fromUnit].p][p].e;
          e = e.replace("|","*");
          converted = math.evaluate(e,{x:fromValue});
          equation += `\\text{${step}. Apply prefix}\\\\${eqTextToLatex(e,fromValue)}=${sh(converted)}\\\\`;
          step += 1;
        }
      } else converted = fromValue;
    } else converted = fromValue;
    // Convert value to SI equivalent
    if (fromUnit !== units["__si"]) {
      if (!(units[fromUnit].f == undefined)) {
        // Factor conversion
        var f = units[fromUnit].f;
        var p = converted;
        converted = math.multiply(converted,math.bignumber(f));
        equation += `\\text{${step}. Convert to SI (via Factor)}\\\\${sh(p)}\\times${sh(f)}=${sh(converted)}\\\\`;
        step += 1;
      }
      // Expression conversion 
      else {
        var p = converted;
        converted = math.evaluate(units[fromUnit].e,{x:converted});
        equation += `\\text{${step}. Convert to SI (via Expression)}\\\\${eqTextToLatex(units[fromUnit].e,p)}=${sh(converted)}\\\\`;
        step += 1;
      }
    }
    // Convert SI equivalent to "to" unit
    if (!(units[toUnit].f == undefined)) {
      // Factor conversion
      var t = math.bignumber(units[toUnit].f);
      var p = converted;
      converted = math.divide(converted,t);
      equation += `\\text{${step}. Convert to ${units[toUnit].s} (via Factor)}\\\\${sh(p)}\\div${sh(t)}=${sh(converted)}\\\\`;
      step += 1;
    } 
    // Expression conversion
    else {
      var p = converted;
      converted = math.evaluate(units[toUnit].t,{x:converted});
      equation += `\\text{${step}. Convert to ${units[toUnit].s} (via Expression)}\\\\${eqTextToLatex(units[toUnit].t,p)}=${sh(converted)}\\\\`;
      step += 1;
    }
    // Convert value to base (if prefix)
    if (units[toUnit].p != undefined) {
      var p = "";
      if (!reverse) p = $("#to-prefix-select").val();
      else p = $("#from-prefix-select").val();
      if (p != "(no prefix)") {
        if (json["__prefix"][units[toUnit].p][p].f != undefined) {
          var a = converted;
          var f = json["__prefix"][units[toUnit].p][p].f;
          converted = math.divide(converted,math.bignumber(f));
          equation += `\\text{${step}. Apply prefix}\\\\${sh(a)}\\div${sh(f)}=${sh(converted)}`
        } else {
          var a = converted;
          var e = json["__prefix"][units[toUnit].p][p].e;
          e = e.replace("|","/");
          converted = math.evaluate(e,{x:converted});
          equation += `\\text{${step}. Apply prefix}\\\\${eqTextToLatex(e,a)}=${sh(converted)}`
        }
      }
    }
    // Set value
    if (!reverse) $('#to').val(math.format(converted,{notation:'fixed'}));
    else $('#from').val(math.format(converted,{notation:'fixed'}));
    // Set equation
    equation += "}$$";
    $("#unit-eq").text(equation);
    MathJax.typeset();
  });
}

function fracToNumber(f) {
  f = f.split("/");
  var x = math.bignumber(f[0]);
  var y = math.bignumber(f[1]);
  return math.format(math.divide(x,y));
}

function eqTextToLatex(e, x) {
  var o = e.replace("*","\\times");
  o = o.replace("/","\\div");
  o = o.replace("x",sh(x));
  return o;
}

function sh(x) {
  // short for shorten
  // commented out till an optimized and working version can be made
  // if ((x.toString()).length > 10) {
  //   var t = x.toString().match(/.{1,12}/g);
  //   var y = Math.round(parseInt(t[0].slice(-3,-2) + "." + t[0].slice(-2)));
  //   var p = "";
  //   if (t[0].slice(-3,-2) === ".") p = ".";
  //   if (isNaN(y)) y = Math.round(parseInt(t[0].slice(-4)));
  //   var z = t[0].slice(0,-3) + p + y;
  //   return "\\text{~}" + z + "\\text{…}";
  // } 
  // else return x;
  return x;
}

$(document).ready(function() {
  // Grid selections
  $('table button.select-box-option-button').click(function(){
    // Display selected option
    $('.select-box').html( $(this).children() );
    $(this).append($('.select-box').html());
    $('.select-box-options').hide();
    // Load units and labels
    var type = $(this).text().replace(/\s/g,'');
    updateUnits(type);
    unitChange(true);
  });
  // Load Mass units by default
  updateUnits("Mass");
  // Default conversion
  $("#from").val("1");
  unitChange(true);
});
function unitChange(first=false,to=false) {
  // Change symbols
  $.getJSON('/unit_rates.json',function(json) {
    var units = json[$('#selected').text().substr(1)];
    // Get selected units
    var fromUnit = $('#from-select').val();
    var toUnit = $('#to-select').val();
    // Set selected units if it's the first time
    if (first) {
      if (units['__defaultFrom'] != undefined) {
        $("#from-select").val(units['__defaultFrom']);
        fromUnit = units['__defaultFrom'];
      } else {
        $("#from-select").val(units['__si']);
        fromUnit = units['__si'];
      }
      $("#to-select").val(units['__defaultTo']);
      toUnit = units['__defaultTo'];
    }
    // Handle common values w/ prefix
    var fp = null;
    if (fromUnit.startsWith("*")) {
      $("#from-select").val(units[fromUnit].n);
      fp = units[fromUnit].p;
      fromUnit = units[fromUnit].n;
    }
    var tp = null;
    if (toUnit.startsWith("*")) {
      $("#to-select").val(units[toUnit].n);
      tp = units[toUnit].p;
      toUnit = units[toUnit].n;
    }
    // Change symbols
    if (!to) {
      $("#from-symbol").text(units[fromUnit].s);
      if (fp !== null) 
        $("#from-symbol").text(json["__prefix"][units[fromUnit].p][fp].s + units[fromUnit].s);
    }
    if (to || first) {
      $("#to-symbol").text(units[toUnit].s);
      if (tp !== null) 
        $("#to-symbol").text(json["__prefix"][units[toUnit].p][tp].s + units[toUnit].s);
    }
    // Handle prefixes
    var nopre = new Option("(no prefix)","(no prefix)");
    var nopre2 = new Option("(no prefix)","(no prefix)");
    $(nopre).html("(no prefix)").attr('label','(no prefix)');
    if (units[fromUnit]["p"] != undefined && !to) {
      $("#from-prefix-select").empty();
      var pre = units[fromUnit]["p"];
      $(nopre).html("(no prefix)").attr('prefix',pre);
      $('#from-prefix-select').append(nopre);
      for (x in json["__prefix"][pre]) {
        var o = new Option(x,x);
        $(o).html(x).attr('label',x);
        $(o).html(x).attr('prefix',pre);
        $('#from-prefix-select').append(o);
      }
      if (fp !== null) 
        $("#from-prefix-select").children(`[value="${fp}"]`).attr('selected',true);
      $("#from-prefix-select").show();
      $("#from-prefix-select").addClass("halfwidth");
      $("#from-select").addClass("halfwidth");
    } else if (!to) {
      $("#from-prefix-select").hide();
      $("#from-prefix-select").removeClass("halfwidth");
      $("#from-select").removeClass("halfwidth");
      $("#from-prefix-select").empty();
    }
    if (units[toUnit]["p"] != undefined && (to || first)) {
      $("#to-prefix-select").empty();
      var pre = units[toUnit]["p"];
      $(nopre2).html("(no prefix)").attr('prefix',pre);
      $('#to-prefix-select').append(nopre2);
      for (x in json["__prefix"][pre]) {
        var o = new Option(x,x);
        $(o).html(x).attr('label',x);
        $(o).html(x).attr('prefix',pre);
        $('#to-prefix-select').append(o);
      }
      if (tp !== null) 
        $("#to-prefix-select").children(`[value="${tp}"]`).attr('selected',true);
      $("#to-prefix-select").show();
      $("#to-prefix-select").addClass("halfwidth");
      $("#to-select").addClass("halfwidth");
    } else if (to) {
      $("#to-prefix-select").hide();
      $("#to-prefix-select").removeClass("halfwidth");
      $("#to-select").removeClass("halfwidth");
      $("#to-prefix-select").empty();
    }
    // Convert units
    convertUnits();
  });
}
function prefixChange(t=false) {
  // Change symbols
  $.getJSON('/unit_rates.json',function(json) {
    var units = json[$('#selected').text().substr(1)];
    // Get selected units and change symbols
    if (!t) {
      var fromUnit = $('#from-select').val();
      var fromPrefix = $('#from-prefix-select').val();
      if (fromPrefix != "(no prefix)") {
        var prefixType = $(`#from-prefix-select option[value="${fromPrefix}"]`).attr("prefix");
        $("#from-symbol").text(json["__prefix"][prefixType][fromPrefix].s + units[fromUnit].s);
      } else $("#from-symbol").text(units[fromUnit].s);
    } else {
      var toUnit = $('#to-select').val();
      var toPrefix = $('#to-prefix-select').val();
      if (toPrefix != "(no prefix)") {
        var prefixType = $(`#to-prefix-select option[value="${toPrefix}"]`).attr("prefix");
        $("#to-symbol").text(json["__prefix"][prefixType][toPrefix].s + units[toUnit].s);
      } else $("#to-symbol").text(units[toUnit].s);
    }
  });
  // Convert units
  convertUnits();
}
function unitRotate() {
  // Animate icon
  $('#logo-icon').attr('id','spin-logo')
  $('#unit-rotate-icon').attr('id','spin');
  setTimeout(()=>$('#spin-logo').attr('id','logo-icon'),500);
  setTimeout(()=>$('#spin').attr('id','unit-rotate-icon'),500);
  // Grab fromUnit and fromSymbol
  var fromUnit = $('#from-select').val();
  var fromSymbol = $("#from-symbol").text();
  // Switch units and symbols
  $('#from-select').val($('#to-select').val());
  $('#to-select').val(fromUnit);
  $('#from-symbol').text($("#to-symbol").text());
  $('#to-symbol').text(fromSymbol);
  // Switch prefixes
  if ($('#from-prefix-select').is(":visible")) {
    if ($('#to-prefix-select').is(":visible")) {
      var fromPrefix = $('#from-prefix-select').children();
      var fromSelected = $('#from-prefix-select').val();
      var toSelected = $('#to-prefix-select').val();
      $('#from-prefix-select').empty();
      $('#from-prefix-select').append($("#to-prefix-select").children());
      $('#from-prefix-select').val(toSelected);
      $('#to-prefix-select').empty();
      $('#to-prefix-select').append(fromPrefix);
      $('#to-prefix-select').val(fromSelected);
    } else {
      var fromSelected = $('#from-prefix-select').val();
      $("#from-prefix-select").hide();
      $("#from-prefix-select").removeClass("halfwidth");
      $("#from-select").removeClass("halfwidth");
      $("#to-prefix-select").append($("#from-prefix-select").children());
      $('#to-prefix-select').val(fromSelected);
      $("#from-prefix-select").empty();
      $("#to-prefix-select").show();
      $("#to-prefix-select").addClass("halfwidth");
      $("#to-select").addClass("halfwidth");
    }
  } else if ($("#to-prefix-select").is(":visible")) {
    var toSelected = $('#to-prefix-select').val();
    $("#to-prefix-select").hide();
    $("#to-prefix-select").removeClass("halfwidth");
    $("#to-select").removeClass("halfwidth");
    $("#from-prefix-select").append($("#to-prefix-select").children());
    $('#from-prefix-select').val(toSelected);
    $("#to-prefix-select").empty();
    $("#from-prefix-select").show();
    $("#from-prefix-select").addClass("halfwidth");
    $("#from-select").addClass("halfwidth");
  }
  // Convert
  convertUnits();
}