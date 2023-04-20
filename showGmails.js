
async function showGmails(shtTitle) {

    var objSht = await openShts(
        [
          { title: shtTitle, type: "all" }
        ])

    if (objSht[shtTitle].rowCount == 0) return

    var shtHdrs = objSht[shtTitle].colHdrs
    var shtArr = objSht[shtTitle].vals
    var subjectCol = shtHdrs.indexOf('Subject')
    var msgDateCol = shtHdrs.indexOf('Last Message Date')

    if (subjectCol<0 || msgDateCol<0) return

    var subjectArr = shtArr.map(x => x[subjectCol]);
    var msgDateArr = shtArr.map(x => x[stamsgDateColtCol]);

    // var nbrDeletes = statArr.filter(x => x !== "Deleted").length;

    for (let i=0;i<subjectArr.length;i++)v{

      sht.push([subjectArr[i], msgDateArr[i], val])

    }
    
    var tbl = new Table();
    
    tbl
      .setHeader()
      .setTableHeaderClass()
      .setData(sht)
      .setTableClass('table table-borderless')
      .setTrClass('d-flex')
      .setTcClass(['text-end col-4 h5 text-success', 'text-start col h4', 'col-1'])
      .setTdClass('py-1 pb-0 border-0 align-bottom border-bottom')
      .build('#tblGmails');
  
    gotoTab('ShowGmails')
  
    // $('#shtContainer > div').eq(idx+1).trigger( "click" )
  
  } 