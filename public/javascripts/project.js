var folder = [];
$(function () {
    // 点击目录
    clickFolder();

    // 工具栏
    toolbars();

    // 大图预览
    imgView();
});

function getQueryStringByName(name) {
    var result = location.search.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
    if (result == null || result.length < 1) {

        return "";

    }
    return result[1];
}

function imgView() {
    var $image = $('.project-folder');

    $image.viewer({});
}

function clickFolder() {
    $('.project-folder li.item-folder').click(function () {
        var curFolder = getQueryStringByName('folderPath');
        window.location.href = window.location.origin + window.location.pathname + '?folderPath=' + curFolder + '/' + $(this).find('span').text();
    })
}

function toolbars() {
    // 返回根目录
    $('.return-root').prop('disabled', !getQueryStringByName('folderPath'));
    $('.return-root').click(function (e) {
        e.preventDefault();
        if(getQueryStringByName('folderPath')){
            window.location.href = window.location.origin + window.location.pathname;
        }else{
            $(this).prop('disabled', true);
        }
    });


    function getFolders(){
        var folderPath = getQueryStringByName('folderPath');
        var pathArray = folderPath.split('/');
        var folders = [];
        for(var i = 0; i < pathArray.length; i++){
            if(pathArray[i]) folders.push(pathArray[i]);
        }

        return folders;
    }

    // 返回上一层
    $('.return-back').prop('disabled', getFolders().length < 1);
    $('.return-back').click(function (e) {
        e.preventDefault();
        var folderPath = getQueryStringByName('folderPath');
        var folders = getFolders();

        if (folderPath) {
            if (folders.length > 1) {
                window.location.href = window.location.origin + window.location.pathname + '?folderPath=' + folders.slice(0, folder.length - 1).join('/');
            }else {
                window.location.href = window.location.origin + window.location.pathname;
            }
        }
    });
}