
function btnGmailDeleteHtml() {

    loadDropDowns()

    gotoTab('GmailDelete')

}

function loadDropDowns() {

    var labels = await listGmailLabels().result.labels

    for (var i=0;i<labels.length;i++) {
        let lbl = labels[i]
        if (lbl.type == 'user') $('#gmail-label-select').append('<option>'+labels[i].name+'</option>')
        if (lbl.type == 'system') $('#gmail-category-select').append('<option>'+labels[i].name+'</option>')

      }

    console.log('listGmailLabels', labels)



}