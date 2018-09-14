$( "#create" ).click(function( event ) {
  event.preventDefault();
  var data = {};
  $("#createForm").serializeArray().map((x) => {data[x.name] = x.value;});

  $.post({
    type: "POST",
    url: url,
    data: data,
    success: (result) => {
      window.location.pathname = 'users'
    },
    dataType: 'json'
  })

});
