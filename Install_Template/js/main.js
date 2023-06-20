var clickCount = 0;
$('.pane-header').on('click', function () {
  clickCount++;
  $(".monaco-list-rows").slideToggle("fast");
  if (clickCount % 2 === 1) {
    $('.bx-chevron-right').removeClass("bx-rotate-90");
  } else {
    $('.bx-chevron-right').addClass("bx-rotate-90");
  }
});

let tabs = document.querySelectorAll(".tab-header");

// tabs.forEach((tab, index) => {
//     tab.addEventListener('click', () =>{


//         contents.forEach((c) => c.classList.remove("active"));
//         contents[index].classList.add("active");
//     });
// });

tabs[0].click();

function ClickFunc(tab, content) {
  let tabs = document.querySelectorAll(".tab-header");
  let contents = document.querySelectorAll(".tab-content");
  tabs.forEach((tabb) => tabb.classList.remove("active"));
  tab.addClass("active");
  contents.forEach((c) => c.classList.remove("active"));
  content.addClass("active");  
}