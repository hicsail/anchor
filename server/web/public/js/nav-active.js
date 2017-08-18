$().ready(function ($) {
  $('.nav-link').each((index, ele) => {

    var element = ele;
    if (window.location.pathname == '/' + $(element).attr('href').split('../').pop()) {
      $(element).addClass('active');
    }
  });
});
