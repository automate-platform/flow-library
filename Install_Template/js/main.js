let clickCountNot = 0;
$('.app-not-installed .pane-header').on('click', function () {
  clickCountNot++;
  if (clickCountNot % 2 === 1) {
    $(".app-not-installed .monaco-list").animate({height:'0px'},300);
    $('.app-not-installed .bx-chevron-right').removeClass("bx-rotate-90");
  } else {
    $('.app-not-installed .bx-chevron-right').addClass("bx-rotate-90");
    $(".app-not-installed .monaco-list").animate({height:'300px'},300);
  }
});

var clickCountYes = 0;
$('.app-installed .pane-header').on('click', function () {
  clickCountYes++;
  if (clickCountYes % 2 === 1) {
    $(".app-installed .monaco-list").animate({height:'0px'},300);
    $('.app-installed .bx-chevron-right').removeClass("bx-rotate-90");
  } else {
    $('.app-installed .bx-chevron-right').addClass("bx-rotate-90");
    $(".app-installed .monaco-list").animate({height:'300px'},300);
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

// // Get the resizable div and resize handle elements
// const resizableDiv = document.getElementById('resizableDiv');
// const resizeHandle = document.getElementById('resizeHandle');

// let isResizing = false;
// let startY, startHeight, originalHeight;
// const minHeight = 260; // Minimum height for the resizable div
// const maxHeight = 900; // Minimum height for the resizable div


// // Function to handle the resizing
// function resizeDiv(event) {
//   if (!isResizing) return;

//   let deltaY = startY - event.clientY;
//   let newHeight = startHeight + deltaY;

//   if (newHeight >= minHeight && newHeight <= maxHeight) {
//     resizableDiv.style.height = newHeight + 'px';
//     resizableDiv.style.top = originalHeight - newHeight + 'px';
//     console.log(resizableDiv.style.height);
//   }

// }

// // Event listener for starting the resizing
// resizeHandle.addEventListener('mousedown', function (event) {
//   isResizing = true;
//   startY = event.clientY;
//   startHeight = resizableDiv.offsetHeight;
//   originalHeight = resizableDiv.offsetHeight + resizableDiv.offsetTop;
// });

// // Event listeners for resizing
// document.addEventListener('mousemove', resizeDiv);
// document.addEventListener('mouseup', function () {
//   isResizing = false;
// });