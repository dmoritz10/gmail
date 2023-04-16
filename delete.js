
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

  var shts = await getSheets()

  var sheets = shts.result.sheets

  console.log('shts', shts, sheets)

  console.log('shts', shts)

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

      console.log('inputOptions', inputOptions)

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

    console.log('objSht', objSht)

  toast("Deleting Gmails from " + shtTitle, 5000)
  var shtHdrs = objSht[shtTitle].colHdrs
  var shtArr = objSht[shtTitle].vals
  var statCol = shtHdrs.indexOf('Status')
  var msgIdsCol = shtHdrs.indexOf('Message Ids')
  
  var msgIdsArr = shtArr.map(x => x[msgIdsCol]);

  console.log('msgIdsArr',msgIdsCol,  msgIdsArr)

  let batchSize = 3
  let pntr = msgIdsArr.length-1

  while (true) {

    let msgArr = []
    let strPntr = pntr

    for (let i = 0;i++; i<batchSize) {

      pntr -= i
      if (pntr < 0) break;

      console.log('msgIdsArr[i]', msgIdsArr[pntr])
      if (msgIdsArr[pntr]) msgArr = msgArr.concat(JSON.parse(msgIdsArr[pntr]))

    }

    if (pntr < 0) break

    console.log('msgArr', msgArr)

    var response = await batchDeleteGmail({
      userId: 'me',
      request: {
        "ids": msgArr
      }
    });

    console.log('responseDelete', response)

    return

    if (response.status !=200 ) return

    return


    var data =     [
      { 
        range: '"' + shtTitle + '"!"' + calcRngA1(strPntr + 2, statCol, msgIdArr.length, 1),   
        values: nbrArr
      }
    ]
  
    var resource = {
      valueInputOption: 'USER_ENTERED',
      data: data
    }
  
    var response = await batchUpdateSheet(resource)
      
  }





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
        case "none":
          var attachment = " -has:attachment"
          break;
        default:
          var attachment = " size:" + listSpec.attachment
          break;
      }
        
      var search = cat + " label:" + listSpec.label + " before:" + beforeDate 
          + (listSpec.attachment = '' ? '' : attachment);

    var createRsp = await createSheet()

    var shtObj = createRsp.result.replies[0].addSheet.properties

    console.log('shtObj', shtObj)

    var clearRsp = await clearSheet(shtObj.sheetId)

    var listThreads = []
    listThreads.push(['Subject', 'Last Message Date', 'Message Count', 'Labels', 'Status', 'Message Ids'])
                    
    var maxResults = 500
    var npt
    var startTime = new Date()
    var msgCntr = 0

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

            // console.log('msgs', msgs)

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
        console.log('listThreads', listThreads)
        var response = await appendSheetRow(listThreads, shtObj.title)

        listThreads = []

    } while (npt)

    console.log('run time', i, msgCntr,  parseInt((new Date() - startTime) / (1000*60)), parseInt((msgCntr * 1000*60) / (new Date() - startTime)))

    var response = renameSheet(shtObj.sheetId, search)

}