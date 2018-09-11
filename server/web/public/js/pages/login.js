$('#login').click((event) => {

  console.log('test');

  event.preventDefault();

  const values = {
    username: $('#username').val(),
    password: $('#password').val()
  };

  $.ajax({
    type: 'POST',
    url: '/api/login',
    data: values,
    success: function (result) {
      location.reload();
    },
    error: function (result) {
      console.error(result);
    }
  });
});
