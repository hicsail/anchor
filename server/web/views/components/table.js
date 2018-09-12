$(document).ready(function() {

  async function getData(page) {
    let requestUrl = url + '?page=' + page;
    return await $.get(requestUrl);
  }

  function updateTable(data) {
    gridOptions.api.setRowData(data);
  }

  function updatePageButtons() {
    var rangeStart = currentPage - 2;
    if(rangeStart < 1) {
      rangeStart = 1;
    }
    var rangeEnd = rangeStart + pageRange;

    if(rangeEnd > totalPage) {
      rangeEnd = totalPage + 1;
      rangeStart = rangeEnd - pageRange;
    }

    if(rangeStart > 1) {
      $('#b1').show();
      $('#b2').show();
    } else {
      $('#b1').hide();
      $('#b2').hide();
    }

    if(currentPage + 2 < totalPage) {
      $('#b8').show();
      $('#b9').show();
    } else {
      $('#b8').hide();
      $('#b9').hide();
    }

    for(let i = 0; i < 5; i++) {
      $('#b' + (i+3)).html(rangeStart + i);
    }




    for(let item of $('.pagination-link')) {
      item = $(item);
      if(currentPage === Number(item.html())) {
        item.addClass('is-current');
      } else {
        item.removeClass('is-current');
      }
    }
    if(currentPage === totalPage) {
      $("#nextButton").attr( "disabled", true );
    } else {
      $("#nextButton").attr( "disabled", false );
    }
    if(currentPage === 1) {
      $("#previousButton").attr( "disabled", true );
    } else {
      $("#previousButton").attr( "disabled", false );
    }
  }

  $('#nextButton').click(async function() {
    if(currentPage < totalPage) {
      currentPage += 1;
      let result = await getData(currentPage);
      updateTable(result.data);
      updatePageButtons();
    }
  });

  $("#previousButton").click(async function() {
    if(currentPage > 1) {
      currentPage -= 1;
      let result = await getData(currentPage);
      updateTable(result.data);
      updatePageButtons();
    }
  });

  $(".pagination-link").click(async function() {
    currentPage = Number($(this).html());
    let result = await getData(currentPage);
    updateTable(result.data);
    updatePageButtons();
  });


});


