var clickCount = 0;
$('.pane-header').on('click', function () {
  clickCount++;
  $(".monaco-list-rows").slideToggle("fast");
  if (clickCount % 2 === 1) {
    $('.bx-chevron-right').removeClass("bx-rotate-90");
  }else{
    $('.bx-chevron-right').addClass("bx-rotate-90");
  }
});

