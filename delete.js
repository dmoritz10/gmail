
function btnGmailDeleteHtml() {

    var labels = listGmailLabels()

    for (var i=0;i<labels.length;i++) {
        $('#gmail-label-select').append('<option>'+labels[i]+'</option>')
      }

    console.log('listGmailLabels', labels)

    gotoTab('GmailDelete')

}