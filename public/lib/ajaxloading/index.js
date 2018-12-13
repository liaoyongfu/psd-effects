/**
 * 页面加载中。。。
 * @param type  类型：'ajax'(传空则为ajax), 'eos3', 'zeus'
 * @param ignoreEosNames    忽略的eos服务名
 */
function ajaxloading(type, ignoreEosNames){
    type = type || 'ajax';
    ignoreEosNames = ignoreEosNames || [];
    var html = '';

    function isInIgnoreEosNames(url){
        var exists = false;

        for(var i = 0; i < ignoreEosNames.length; i++){
            if(url.indexOf(ignoreEosNames[i]) != -1){
                exists = true;
                break;
            }
        }

        return exists;
    }

    switch (type){
        case 'ajax':
            if($('#bgbg, #ss_loading').length == 0){
                html='<div style="background: #999; opacity: 0.4; filter:alpha(opacity=40); position: fixed;left: 0;' +
                    'right: 0;top: 0;bottom: 0;z-index: 99998; display: none;" id="bgbg"></div>'
                    +' <div class="loadingBg" id="ss_loading">'
                    +'   <!--加载动画-->'
                    +'  <div class="loadingContent">'
                    +'   <!--显示文本-->'
                    +' <div id="ss_loading_text"><i></i>加载中，请稍后...</div>'
                    +'  </div>'
                    +' </div>';
                $('body').append(html);
            }
            var count = 0;
            $(document).bind('ajaxSend',function(event, jqXHR, options){
                count ++;
                //这里可以配置不想显示加载中的方法
                if(isInIgnoreEosNames(options.url)){
                    return;
                }else if(count>0){
                    $("#bgbg,#ss_loading").show();
                    //console.info('ajaxSend',count);
                }
            });
            $(document).bind('ajaxComplete',function(){
                if(count>0) count --;
                if(count == 0){
                    $("#bgbg,#ss_loading").hide();
                    //console.info('ajaxComplete',count);
                }

            });
            break;
        case 'eos3':
            if(typeof eos == 'undefined'){
                throw new Error('没引eos3!!!');
            }
            if($('#bgbg, #ss_loading').length == 0){
                html='<div style="background: #999; opacity: 0.4; filter:alpha(opacity=40); position: fixed;left: 0;' +
                    'right: 0;top: 0;bottom: 0;z-index: 99998; display: none;" id="bgbg"></div>'
                    +' <div class="loadingBg" id="ss_loading">'
                    +'   <!--加载动画-->'
                    +'  <div class="loadingContent">'
                    +'   <!--显示文本-->'
                    +' <div id="ss_loading_text"><i></i>加载中，请稍后...</div>'
                    +'  </div>'
                    +' </div>';
                $('body').append(html);
            }
            var _bg_count = 0;
            eos.defaultSettings.error = function (msg) {
                if(msg&&msg.indexOf("status=0")==-1){
                    console.info(msg);
                }
                return;
            };
            eos.defaultSettings.beforeSend = function (event, jqXHR, options) {
                _bg_count++;
                var url = jqXHR.url;

                if(isInIgnoreEosNames(url)){

                }else{
                    $("#bgbg,#ss_loading").show();
                }
            };
            eos.defaultSettings.complete = function () {
                if (_bg_count > 0) _bg_count--;
                if (_bg_count == 0) {
                    $("#bgbg,#ss_loading").hide();
                }
            };
            break;
        case 'zeus':
            if($('#bgbg, #ss_loading').length == 0){
                html='<div style="background: #999; opacity: 0.4; filter:alpha(opacity=40); position: fixed;left: 0;' +
                    'right: 0;top: 0;bottom: 0;z-index: 99998; display: none;" id="bgbg"></div>'
                    +' <div class="loadingBg" id="ss_loading">'
                    +'   <!--加载动画-->'
                    +'  <div class="loadingContent">'
                    +'   <!--显示文本-->'
                    +' <div id="ss_loading_text"><i></i>加载中，请稍后...</div>'
                    +'  </div>'
                    +' </div>';
                $('body').append(html);
            }
            var count = 0;
            $(document).bind('ajaxSend',function(event, jqXHR, options){
                count ++;
                if(isInIgnoreEosNames(options.url)){
                    return;
                }else if(count>0){
                    $(".loader").show();
                }
            });
            $(document).bind('ajaxComplete',function(){
                if(count>0) count --;
                if(count == 0){
                    $(".loader").hide();
                }

            });

            break;
    }
}