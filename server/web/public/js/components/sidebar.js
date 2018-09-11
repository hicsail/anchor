$(document).ready(function() {

  for (let item of $('.sidebar-item')) {
    item = $(item);
    if (window.location.pathname === item.attr('href')) {
      item.addClass('is-active');
    }
  }
});
