function do_submit()
{
	show_waitbox(true);
	document.f.submit();
}
/*sLog*/
var sLog_body;
var sLog_line_number;
function sLog_init()
{
	sLog_line_number = 0;
	sLog_body=document.getElementById("slog_list");
}
function sLog_clear()
{
	while(sLog_body.childNodes.length > 0)
	{
		aChild=sLog_body.firstChild;
		sLog_body.removeChild(aChild);
	}
	sLog_line_number =  0;
}
function sLog_addRow(_body, state, action_text, state_text)
{
	sLog_line_number++;
	var mycurrent_row = y_add_row_to_table(_body, ((sLog_line_number % 2) ==0)?"a":"b" );
	var __img ="/images/ok.gif";
	switch (state)
	{
		case "green":	__img = "/images/check_green.gif"; break;
		case "yellow":	__img = "/images/excl_yellow.gif"; break;
		case "ok":	__img = "/images/ok.gif"; break;
		case "red":	__img = "/images/x_red.gif"; break;
	}
	y_add_html_cell_to_row(mycurrent_row, "icon", "<img src='"+__img+"'>");
	y_add_html_cell_to_row(mycurrent_row, "action_text", action_text);
	y_add_text_cell_to_row(mycurrent_row, "state_text", state_text);
}
/*update_list*/
var update_body;
var upd_extentions = new Array(); 	/*<upd_site>,<type=n|m>,<link text>,<link helptext>,<url>,<unique tag>,<version>,<url of installer>*/
var installed_extentions = new Array(); /*<type=n|m>,<link text>,<link helptext>,<url>,<unique tag>,<version>*/
var update_sites = new Array();		/*<type=u>,<update site name>,<update site helptext>,<url of extention list>*/
function update_list_init()
{
	update_body=document.getElementById("update_list");
}
function update_list_clear()
{
	while(update_body.childNodes.length > 0){
		aChild=update_body.firstChild;
		update_body.removeChild(aChild);
	}
}
function update_list_addRow(_body, i, site, extention, tag, your_version, update_version)
{
	var mycurrent_row = y_add_row_to_table(_body, ((i % 2) ==0)?"a":"b" );
	y_add_html_cell_to_row(mycurrent_row, "setupdate", '<input type="checkbox" name="setupdate">');
	y_add_text_cell_to_row(mycurrent_row, "site", site);
	y_add_text_cell_to_row(mycurrent_row, "extention", extention);
	y_add_text_cell_to_row(mycurrent_row, "tag", tag);
	y_add_text_cell_to_row(mycurrent_row, "your_version", your_version);
	y_add_html_cell_to_row(mycurrent_row, "update_version", update_version);
}
function build_list()
{
	$('statusline').show();
	window.setTimeout("build_list2()",300);
}
function build_list2()
{
	sLog_init();
	update_list_init();
	update_list_clear();
	/*get installed ext and update sites*/
	var extlist = loadSyncURL("/control/exec?Y_Tools&get_extension_list&" + Math.random());
	var list = extlist.split("\n");
	installed_extentions = new Array();
	update_sites = new Array();
	for(i=0;i<list.length;i++){
		var ext_type = list[i].charAt(0);
		if(ext_type=="n" || ext_type=="m"){
			var pieces=list[i].split(",");
			installed_extentions.push(pieces);
		} else if(ext_type == "u"){
			var pieces=list[i].split(",");
			update_sites.push(pieces);
		}
	}
	sLog_addRow(sLog_body, "green", "installed Extensions: "+installed_extentions.length, "ok");
	/* get updatesite ext*/
	upd_extentions = new Array();
	for(i=0;i<update_sites.length;i++){
		var update_file = loadSyncURL("/control/exec?Y_Tools&url_get&"+update_sites[i][3]+"&ext_upt.txt&" + Math.random());
		if(update_file.search(/wget: cannot/)!=-1){
			sLog_addRow(sLog_body, "red", "cannot get list from: "+update_sites[i][3], "error");
			/*alert(update_file);*/
		}
		else{
			sLog_addRow(sLog_body, "green", "get list from: "+update_sites[i][3], "ok");
			var list = update_file.split("\n");
			for(j=0;j<list.length;j++){
				var ext_type = list[j].charAt(0);
				if(ext_type=="n" || ext_type=="m"){
					var pieces=list[j].split(",");
					pieces.unshift(update_sites[i][1]);
					upd_extentions.push(pieces);
				}
			}
		}
	}
	/*build_list*/
	for(i=0;i<upd_extentions.length;i++){
		var your_version="%";
		for(j=0;j<installed_extentions.length;j++)
			if(installed_extentions[j][4]==upd_extentions[i][5])
				your_version = installed_extentions[j][5];
		update_list_addRow(update_body,i,upd_extentions[i][0],upd_extentions[i][2],upd_extentions[i][5],your_version,upd_extentions[i][6]);
	}
	$('statusline').hide();
}
function do_set_updates()
{
	show_waitbox(true);
	window.setTimeout("do_set_updates2()",300);
}
function do_set_updates2()
{
	var _rows = update_body.getElementsByTagName("tr");
	for(var i=0; i< _rows.length; i++){
		var rowNode = _rows.item(i);
		if(rowNode.firstChild.firstChild.checked == true){
			var res = loadSyncURL("/control/exec?Y_Tools&ext_installer&"+upd_extentions[i][7]);
			if(res.search(/error/)!=-1){
				alert(res);
				sLog_addRow(sLog_body, "red", "update error: "+res, "error");
			}
			else{
				sLog_addRow(sLog_body, "green", "installed/updates: "+upd_extentions[i][2], "ok");
				add_item_to_ext_list(i);
			}
		}
	}
	sLog_addRow(sLog_body, "green", "updating local extension list. Starting ...", "ok");
	var ext=write_extentions();
	document.f.extentions.value=ext;
	show_waitbox(false);
	alert("update fertig. Menue neuladen.")
	do_submit();
}
function write_extentions()
{
	var ext="";
	for(i=0;i<installed_extentions.length;i++)
		ext += installed_extentions[i]+"\n";
	for(i=0;i<update_sites.length;i++)
		ext += update_sites[i]+"\n";
	return ext;
}
function add_item_to_ext_list(upd_index)
{
	/*allready installed*/
	var allready_installed = false;
	for(i=0;i<installed_extentions.length;i++){
		if(installed_extentions[i][4]==upd_extentions[upd_index][5]){
			allready_installed = true;
			for(j=0;j<=5;j++)
				installed_extentions[i][j] = upd_extentions[upd_index][j+1];
		}
	}
	if(!allready_installed){
		upd_extentions[upd_index].shift();//delete site name
		upd_extentions[upd_index].pop();//delete url
		var new_ext = upd_extentions[upd_index];
		installed_extentions.push(new_ext);
	}
}
