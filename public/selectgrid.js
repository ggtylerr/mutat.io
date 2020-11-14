$(document).ready(function() {
  // Toggle selection options
  // $('.select-box').click(function(){
  //   if ($('.select-box-options').css('display') == 'none') $('.select-box-options').css('display','table');
  //   else $('.select-box-options').css('display','none');
  // });

  // Hovercode
  $('.select-box').hover(function() {
    hoverOn(this);
  },function() {
    hoverOff(this);
  });
  $('.select-box-options').hover(function() {
    hoverOn(this);
  },function() {
    hoverOff(this);
  });
});

function hoverOn(e) {
  $('.select-box').css({'background-color':'#818181','color':'#f1f1f1'});
  $('.select-box-options').css('display','table');
}

function hoverOff(e) {
  $('.select-box').css({'background-color':'#222222','color':'#818181'});
  $('.select-box-options').css('display','none');
}