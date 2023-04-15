
function btnGmailDeleteHtml() {

    loadDropDowns()

    gotoTab('GmailDelete')

}

async function loadDropDowns() {

    var l = await listGmailLabels()
    var labels = l.result.labels

    for (var i=0;i<labels.length;i++) {
        let l = labels[i].name.replace('CATEGORY_', '').replace('DRAFT', 'DRAFTS').toLowerCase()
        let lbl = l.charAt(0).toUpperCase() + l.slice(1)
        if (labels[i].type == 'user')   $('#gmail-label-select').append('<option>'+lbl+'</option>')
        if (labels[i].type == 'system') $('#gmail-category-select').append('<option>'+lbl+'</option>')

      }

}

async function onDeleteClick() {


}

async function onListClick() {

    var category_selected = $('#gmail-category-select').val();
    var label_selected = $('#gmail-label-select').val();
    var date_selected = $('#gmail-date-select').val();
    var attachments_selected = $('#gmail-has-attachment-select').val()
    
    var listSpec = {category:category_selected, label:label_selected, date:date_selected, attachment:attachments_selected}

    if (listSpec.date == '') {
        var age = new Date()  
        age.setDate(age.getDate() + 1);    
      } else {
        var age = new Date(listSpec.date.replace('-','/','g'));
      }
      
      var beforeDate  = age.getFullYear() + '-' + (age.getMonth()*1+1)+'' + '-' + age.getDate()+'';

      if (listSpec.category == "") {
        var cat = ""
      }
      else if (listSpec.category == "Sent" || listSpec.category == "Inbox" || listSpec.category == "Trash" || listSpec.category == "Spam") {
        var cat = "in:" + listSpec.category
      } else {
        var cat = "category:" + listSpec.category
      }
      
      switch (listSpec.attachment) {
        case "":
          var attachment = ''
          break;
        case "all":
          var attachment = " has:attachment"
          break;
        default:
          var attachment = " size:" + listSpec.attachment
          break;
      }
        
      var search = cat + " label:" + listSpec.label + " before:" + beforeDate 
          + (listSpec.attachment = '' ? '' : attachment);

    
    var listThreads = []
    var maxResults = 100
    var npt

    do {
        var responseList = await listGmailThreads({
            userId: 'me',
            pageToken: npt,
            maxResults: maxResults,
            q: search
            
        });

        npt = responseList.result.nextPageToken

        var threads = responseList.result.threads

        if (threads.length == 0) {return 'No Gmails match the criteria given: ' + formatlistSpec(listSpec)}
                
        for (var i=0; i<threads.length; i++)    {

            let thread = threads[i]

            let responseGet = await getGmailMessages({
                userId: 'me',
                id: thread.id,
                format: 'full'
            });

            let msgs = responseGet.result.messages

            console.log('msgs', msgs)

            let mostRecentMsg = new Date(msgs[msgs.length-1].internalDate*1)

            if (mostRecentMsg > age) continue

            let hdrs = msgs[0].payload.headers

            let subject = hdrs.find(x => x.name.toLowerCase() === "subject").value
            let date = hdrs.find(x => x.name.toLowerCase() === "date").value
            let msgIds = msgs.map(a => a.id);

            listThreads.push([
                subject,
                mostRecentMsg.getFullYear() + '-' + (mostRecentMsg.getMonth()*1+1)+'' + '-' + mostRecentMsg.getDate()+'',
                msgIds.length,
                JSON.stringify(msgs[0].labelIds),
                'List',
                JSON.stringify(msgIds)
            ])

        }

    } while (npt)

    var createRsp = await createSheet()

    var shtObj = createRsp.result.replies[0].addSheet.properties

    console.log('shtObj', shtObj)

    var clearRsp = await clearSheet(shtObj.sheetId)

    listThreads.unshift(['Subject', 'Last Message Date', 'Message Count', 'Labels', 'Status', 'Message Ids']);
    
    var response = updateSheet(shtObj.title, listThreads)

    var response = renameSheet(shtObj.sheetId, search)

}