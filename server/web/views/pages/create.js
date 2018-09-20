$( "#create" ).click(function( event ) {
  event.preventDefault();
  var data = {};
  $("#createForm").serializeArray().map((x) => {data[x.name] = x.value;});

  $.post({
    type: "POST",
    url: url,
    data: data,
    success: (result) => {
      window.location.pathname = window.location.pathname.split('/').slice(0,-1).join('/');
    },
    dataType: 'json'
  })

});
