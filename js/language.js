<!--
  //get url parameters
  var url_param = location.search.substring(1);
  var param = {}
  if (url_param){
    url_param = url_param.split("&");
    for (var i=0;i<url_param.length;i++){
      var buf = url_param[i].split("=");
      param[buf[0]] = buf[1];
    }
  }

  //if the lang is undefined at url parameter then English is selected
  var lang = param.lang;
  if(!lang) lang = "english";

  setLanguagesselector();
  transHTML();

  function setLanguagesselector(){
  var innerHtml = "";
    for(var key in textSet){
      innerHtml += "<option value='"+key+"'>"+textSet[key]["Language"]+"</toption>";
    }
    $("#soflow-l").html(innerHtml);
    $("#soflow-l").val(lang);
  }

  function languagesselectorListener(){
    lang = $("#soflow-l").val();
    location.href = location.href.split("?")[0] + "?"+ "lang=" + lang;
  }

  function transHTML(){
    var command;
    //all text in tag <span class='lang-command'> are used as command to translation
    for (var i=0; i<$(".lang-command").length; i++){
      command = $(".lang-command").eq(i).html();
      if(textSet[lang] && textSet[lang][command]) $(".lang-command").eq(i).html(textSet[lang][command]);
      else if(textSet["english"][command]) $(".lang-command").eq(i).html(textSet["english"][command]);
    }
    //all value starting with "$" in option tag and i tag's title attribute are used as command to translation
    for (var i=0; i<$("option").length; i++){
      command = $("option").eq(i).text();
      if(command.charAt(0) == "$"){
        if(textSet[lang] && textSet[lang][command.substring(1)]) $("option").eq(i).text(textSet[lang][command.substring(1)]);
        else if(textSet["english"][command.substring(1)]) $("option").eq(i).text(textSet["english"][command.substring(1)]);
      }
    }
    for (var i=0; i<$("i").length; i++){
      if($("i").eq(i).attr("title")){
        command = $("i").eq(i).attr("title");
        if(command.charAt(0) == "$"){
          if(textSet[lang] && textSet[lang][command.substring(1)]) $("i").eq(i).attr("title", textSet[lang][command.substring(1)]);
          else if(textSet["english"][command.substring(1)]) $("i").eq(i).attr("title", textSet["english"][command.substring(1)]);
        }
      }
    }
  }
  function transJS(command, argments){
    var result = "";
    if(textSet[lang] && textSet[lang][command]) result = textSet[lang][command];
    else if(textSet["english"][command]) result = textSet["english"][command];
    else result = command;
    for(var key in argments){
      result = result.split("["+key+"]").join(argments[key]);
    }
    return result;
  }

//-->
