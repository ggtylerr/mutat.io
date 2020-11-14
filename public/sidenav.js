function openSidenav() {
  document.getElementById("main").style.marginLeft = "190px";
  document.getElementById("topbar").style.marginLeft = "190px";
  document.getElementById("sidenav").style.width = "190px";
  document.getElementById("sidenav").style.display = "block";
  document.getElementById("openSidenav").style.display = 'none';
}
function closeSidenav() {
  document.getElementById("main").style.marginLeft = "0%";
  document.getElementById("topbar").style.marginLeft = "0%";
  document.getElementById("openSidenav").style.display = "inline-block";
  document.getElementById("sidenav").style.marginLeft = "-190px";
  setTimeout(()=>{
    document.getElementById("sidenav").style.display = "none";
    document.getElementById("sidenav").style.marginLeft = "0%";
  },400);
}
function loadPage(url) {
  document.getElementById("mainIFrame").src = url;
}