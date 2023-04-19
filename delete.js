
function btnGmailDeleteHtml() {

    loadDropDowns()

    // $('#nav-select').trigger('click');
    gotoTab('GmailDelete')
    // $('#nav-delete').trigger('click');

    // var someTabTriggerEl = document.querySelector('#nav-delete')
    // var tab = new bootstrap.Tab(someTabTriggerEl)
    // tab.show()


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

  clearStatus()

  var shts = await getSheets()

  var sheets = shts.result.sheets

  if (sheets) {

    var nbrSheets = 0
    let inputOptions = []
    inputOptions.push({
      text: 'Choose sheet ...',
      value: ''
    })

  
    for (var j = 0; j < sheets.length; j++) {

      var sht = sheets[j].properties

      // if (sht.gridProperties.columnCount != 6) continue

      let shtTitle = sht.title

      inputOptions.push({
        text: shtTitle,
        value: shtTitle
      })
        
    }

    bootbox.prompt({
      title: 'Select Sheet with emails to delete',
      inputType: 'select',
      inputOptions:inputOptions,
      callback: (sht) => deleteGmails(sht)
    });

  }

}

async function deleteGmails(shtTitle) {

  if (!shtTitle) return

  var objSht = await openShts(
    [
      { title: shtTitle, type: "all" }
    ])


  var shtHdrs = objSht[shtTitle].colHdrs
  var shtArr = objSht[shtTitle].vals
  var statCol = shtHdrs.indexOf('Status')
  var msgIdsCol = shtHdrs.indexOf('Message Ids')
  
  var msgIdsArr = shtArr.map(x => x[msgIdsCol]);
  var statArr = shtArr.map(x => x[statCol]);

  var nbrDeletes = statArr.filter(x => x !== "Deleted").length;

  var msg = "Ok to delete " + nbrDeletes + " emails from " + shtTitle + " ?"
  var response = await confirm(msg);
  if (!response) return

  postStatus("Deleting Gmails "+ nbrDeletes + " from " + shtTitle)

  modal(true)


  var batchSize = 50
  var pntr = msgIdsArr.length
  var delCntr = 0

  while (true) {

    var msgArr = []
    var cntr = 0

    for (let i = 0; i<batchSize;i++) {

      cntr++
      pntr--

      if (pntr < 0) {
        pntr = 0
        break;
      }

      if (msgIdsArr[pntr] && statArr[pntr] != 'Deleted') msgArr = msgArr.concat(JSON.parse(msgIdsArr[pntr]))

    }

    if (pntr == 0 && msgArr.length == 0) break;

    if (msgArr.length == 0) continue

    var response = await batchDeleteGmail({
      userId: 'me',
      resource: {
        "ids": msgArr
      }
    });

    if (response.status !=204 ) return

    delCntr += msgArr.length

    postStatus(null, delCntr + " emails deleted.")

    var data =     [
      {
        range: "'" + shtTitle + "'!" + calcRngA1(pntr + 2, statCol + 1, cntr, 1),   
        values: new Array(cntr).fill(['Deleted'])
      }
    ]
  
    var resource = {
      valueInputOption: 'USER_ENTERED',
      data: data
    }
  
    var response = await batchUpdateSheet(resource)

  }

  postStatus("Complete<br>", delCntr + " emails deleted.")
  
  modal(false)

}


async function onListClick() {

    clearStatus()

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
        case "none":
          var attachment = " -has:attachment"
          break;
        default:
          var attachment = " size:" + listSpec.attachment
          break;
      }
        
      var search = (cat + " label:" + listSpec.label + " before:" + beforeDate 
          + (listSpec.attachment = '' ? '' : attachment)).trimStart();

    let testShtId = await getSheetId(search)
    if (testShtId) await deleteSheet(testShtId)

    var createRsp = await createSheet()

    var shtId = createRsp.result.replies[0].addSheet.properties.sheetId
    var shtTitle = createRsp.result.replies[0].addSheet.properties.title

    var clearRsp = await clearSheet(shtId)

    var listThreads = []
    listThreads.push(['Subject', 'Last Message Date', 'Message Count', 'Labels', 'Status', 'Message Ids'])
                    
    var maxResults = 500
    var npt
    var startTime = new Date()
    var msgCntr = 0

    modal(true)

    do {
        var responseList = await listGmailThreads({
            userId: 'me',
            pageToken: npt,
            maxResults: maxResults,
            q: search
            
        });

        npt = responseList.result.nextPageToken

        var threads = responseList.result.threads

        if (!threads || threads.length == 0) {
          postStatus("Error", 'No Gmails match the criteria given: <br><br>' + search, 'text-danger')
          modal(false)
          return
        }
               
        postStatus("Listing Gmails<br>" + search)
        
        for (var i=0; i<threads.length; i++)    {

            let thread = threads[i]

            let responseGet = await getGmailMessages({
                userId: 'me',
                id: thread.id,
                format: 'full'
            });

            postStatus(null, msgCntr)

            let msgs = responseGet.result.messages

            console.log('responseGet', responseGet)

            let mostRecentMsg = new Date(msgs[msgs.length-1].internalDate*1)

            if (mostRecentMsg > age) continue

            let hdrs = msgs[0].payload.headers

            let subject = hdrs.find(x => x.name.toLowerCase() === "subject").value
            let msgIds = msgs.map(a => a.id);

            listThreads.push([
                subject,
                mostRecentMsg.getFullYear() + '-' + (mostRecentMsg.getMonth()*1+1)+'' + '-' + mostRecentMsg.getDate()+'',
                msgIds.length,
                JSON.stringify(msgs[0].labelIds),
                'List',
                JSON.stringify(msgIds)
            ])

            msgCntr += msgIds.length

            console.log('progress', i, msgIds.length, msgCntr,  parseInt(msgCntr * 1000*60 / (new Date() - startTime)))

        }
        var response = await appendSheetRow(listThreads, shtTitle)

        listThreads = []

    } while (npt)

    console.log('run time', i, msgCntr,  parseInt((new Date() - startTime) / (1000*60)), parseInt((msgCntr * 1000*60) / (new Date() - startTime)))

    var msg = msgCntr + ' emails selected<br>' + 
              Math.round((new Date() - startTime) / (1000*60)) + ' minutes<br>' + 
              Math.round((msgCntr * 1000*60) / (new Date() - startTime)) + ' emails per minute'

    postStatus("Complete<br>" + search, msg)

    var response = renameSheet(shtId, search)



    modal(false)

}

function postStatus(status, text, textColor = 'text-black') {
  if (status) $("#dgStatus").html(status).addClass(textColor).removeClass('d-none')
  if (text)   $("#dgText").html(text).removeClass('d-none')

}

function clearStatus() {
  $("#dgStatus").html('').addClass('d-none')
  $("#dgStatus").removeClass((index, className) => (className.match (/\bg-\S+/g) || []).join(' '))
  $("#dgText").html('').addClass('d-none')
  
}