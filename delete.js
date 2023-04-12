
function btnGmailDeleteHtml() {

    loadDropDowns()

    gotoTab('GmailDelete')

}

async function loadDropDowns() {

    var l = await listGmailLabels()
    console.log('l', l)
    var labels = l.result.labels

    console.log('listGmailLabels', labels)

    for (var i=0;i<labels.length;i++) {
        let lbl = labels[i]
        if (lbl.type == 'user') $('#gmail-label-select').append('<option>'+labels[i].name+'</option>')
        if (lbl.type == 'system') $('#gmail-category-select').append('<option>'+labels[i].name+'</option>')

      }

      // this and that



}