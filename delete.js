
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

    var shtId = await getSheetId()

    await renameSheet(shtId, 'dan')

    var threadsToPurge = []
    var listThreads = []
      
    var clearRsp = await clearSheet(shtId)

    var appendRsp = await appendSheetRow(['Subject', 'Last Message Date', 'Message Count', 'Labels', (attachment != '' ? "Nbr Attachments" : ""), (attachment != '' ? "Size (mb)" : "")], 'dan')
    
    var row = 2
    var searchIdx = 0
    

    // var threads = function listGmailThreads(userId, search, callback) {
    //     var getPageOfThreads = function (request, result) {
    //       request.execute(function (resp) {
    //         result = result.concat(resp.threads);
    //         var nextPageToken = resp.nextPageToken;
    //         if (nextPageToken) {
    //           request = gapi.client.gmail.users.threads.list({
    //             userId: userId,
    //             q: query,
    //             pageToken: nextPageToken,
    //           });
    //           getPageOfThreads(request, result);
    //         } else {
    //           callback(result);
    //         }
    //       });
    //     };
    //     var request = gapi.client.gmail.users.threads.list({
    //       userId: userId,
    //       q: query,
    //     });
    //     getPageOfThreads(request, []);
    //   };

    //   threads()

        var maxResults = 25
      
        do {
            var responseList = await gapi.client.gmail.users.threads.list({
                userId: 'me',
                maxResults: maxResults,
                q: search
                
            });

            var threads = responseList.result.threads

            if (threads.length == 0) {return 'No Gmails match the criteria given: ' + formatlistSpec(listSpec)}
            console.log('search', search, threads, threads.length, age)
            searchIdx = searchIdx + threads.length
                    
            for (var i=0; i<threads.length; i++)    {

                let thread = threads[i]

                let responseGet = await gapi.client.gmail.users.threads.get({
                    userId: 'me',
                    id: thread.id,
                    format: 'full'
                });

                let msgs = responseGet.result.messages

                console.log('msgs', msgs)

                let mostRecentMsg = new Date(msgs[msgs.length-1].internalDate*1)

                if (mostRecentMsg > age) continue

                console.log('mostRecentMsg', mostRecentMsg, age, mostRecentMsg > age)

            }

          

        console.log('process threads')
        // currentSheet.getRange(row, 1, listThreads.length, listThreads[0].length).setValues(listThreads)
        // currentSheet.getRange(1, 1, 1, 1).setNote(searchIdx)
        
        row += listThreads.length
        
        // console.log('threadsToPurge', threadsToPurge)
        // console.log(threadsToPurge.length)
        
        listThreads = []
        } while (threads.length == 123456)
        
        /*
        // currentSheet.getRange(1, 1, 1, 1).clearNote()
          
        if (listSpec.action == 'delete') {
    //      var response = ui.alert("Delete Gmail", "Press 'OK' to move " + threadsToPurge.length + ' Gmails to the Trash', ui.ButtonSet.OK_CANCEL);
    
    //      if (response.toString().toLowerCase() == 'ok') {
          if ('ok' == 'ok') {
            var batchSize = 100 // Process up to 100 threads at once
            for (j = 0; j < threadsToPurge.length; j+=batchSize) {
              GmailApp.moveThreadsToTrash(threadsToPurge.slice(j, j+batchSize));
        console.log('move to trash')
        console.log(j+batchSize)
            }
            return threadsToPurge.length + ' Gmails successfully deleted: ' + formatlistSpec(listSpec)
    //        ui.alert("Delete Gmail", "Complete", ui.ButtonSet.OK);
          } else {
            return 'Gmail Delete canceled' 
          }
        }
*/
}