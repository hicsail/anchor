$( "#edit" ).click(function( event ) {
  event.preventDefault();
  var data = {};
  $("#editForm").serializeArray().map((x) => {
    if(x.value === 'on') {
      data[x.name] = true;
    } else {
      data[x.name] = x.value;
    }
  });

  $.post({
    type: "PUT",
    url: url,
    data,
    success: (result) => {
      window.location.pathname = window.location.pathname.split('/').slice(0,-1).join('/');
    },
    dataType: 'json'
  })

});
