var user = null;

$(function(){
    ajaxloading('ajax');

    // 注册
    registry();

    // 登录
    login();

    // 添加svn地址
    addSvn();

    // 编辑SVN工程信息
    editProject();

    // 删除工程
    removeProject();
});

function isChinese(str){
    if(/^[\u3220-\uFA29]+$/.test(str)){
        return true;
    }else{
        return false;
    }
}

function removeProject(){
    $('.btn-remove').click(function(){
        var id = $(this).parent().data('id');
        var enName = $.trim($(this).parent().find('.project-en-name em').text());

        $.ajax('/removeProject', {
            type: 'post',
            data: {
                id: id,
                enName: enName
            },
            success: function(result){
                if(result.status){
                    window.location.reload();
                }else{
                    alert('删除失败！');
                }
            }
        })
    });
}

function resetAddSvnModal(){
    $("#svn").val('');
    $("#zhName").val('');
    $("#enName").val('');
    $("#svnUserName").val('');
    $("#svnPassword").val('');
    $("#isPublic").prop('checked', false);
}

function editProject(){
    $('#addSvnModal').on('shown.bs.modal', function(e){
        var $related = $(e.relatedTarget);

        if($related.hasClass('btn-edit')){
            $('#svn').prop('disabled', true);
            $(this).attr('aid', $related.parent().data('id')).addClass('edit-svn');
            var $parent = $related.parent();
            var svn = $.trim($parent.find(".project-svn em").text());
            var zhName = $.trim($parent.find('.project-zh-name em').text());
            var enName = $.trim($parent.find('.project-en-name em').text());
            var svnUserName = $.trim($parent.find('.project-svn-user-name em').text());
            var svnPassword = $.trim($parent.find('.project-svn-password em').text());
            var isPublic = $.trim($parent.find('.project-is-public em').text());
            var userName = $.trim($parent.find('.project-user-name em').text());

            $("#svn").val(svn);
            $("#zhName").val(zhName);
            $("#enName").val(enName);
            $('#svnUserName').val(svnUserName);
            $('#svnPassword').val(svnPassword);
            $("#userName").val(userName);
            $("#isPublic").prop('checked', isPublic === '是');
        }else{
            resetAddSvnModal();
            $('#svn').prop('disabled', false);
            $(this).removeAttr('aid').removeClass('edit-svn');
        }
    });
}

function addSvn(){
    $('#resetBtn').on('click', function(){
        resetAddSvnModal();
    });
    $('#addSvnForm').submit(function(e){
        e.preventDefault();
        var svn = $.trim($("#svn").val());
        var zhName = $.trim($('#zhName').val());
        var enName = $.trim($('#enName').val());
        var isPublic = $('#isPublic').is(':checked');
        var userName = $.trim($('#userName').val());
        var svnUserName = $.trim($('#svnUserName').val());
        var svnPassword = $.trim($('#svnPassword').val());

        if(!svn || !enName || !zhName || !svnUserName || !svnPassword){
            alert('请填写svn地址、项目中文名称、项目英文、svn用户名、svn密码！');
            return;
        }

        $.ajax('/addSvn', {
            type: 'post',
            data: {
                svn: svn,
                zhName: zhName,
                enName: enName,
                userName: userName,
                isPublic: isPublic,
                svnUserName: svnUserName,
                svnPassword: svnPassword,
                isEdit: $('#addSvnModal').hasClass('edit-svn'),
                id: $('#addSvnModal').attr('aid')
            },
            success: function(result){
                if(result.status){
                    $('.add-svn-error-msg').html('');
                    window.location.reload();
                }else{
                    $('.add-svn-error-msg').html(result.message);
                }
            }
        });
    });
}

function login(){
    $('#loginForm').submit(function(e) {
        e.preventDefault();
        var loginName = $.trim($('#loginName').val());
        var loginPassword = $.trim($('#loginPassword').val());

        if(!loginName || !loginPassword){
            alert('请填写用户名和密码！');
            return;
        }

        $.ajax('/users/login', {
            type: 'post',
            data: {
                userName: loginName,
                password: loginPassword
            },
            success: function(result){
                if(!result.status){
                    $('.login-error-msg').html(result.message);
                }else{
                    $('.login-error-msg').html('');
                    window.location.reload();
                }
            }
        });
    });
}

function registry(){
    $('#registryForm').submit(function(e){
        e.preventDefault();
        var userName = $.trim($('#registryUserName').val());
        var password = $.trim($('#password').val());
        var rePassword = $.trim($('#rePassword').val());

        if(!userName || !password || !rePassword){
            alert('请输入用户名和密码！');
            return;
        }
        if(!isChinese(userName)){
            alert('用户名只能用中文！');
            return;
        }
        if(password !== rePassword){
            alert('两次输入的密码不一致！');
            return;
        }

        $.ajax('/users/registry', {
            type: 'post',
            data: {
                userName: userName,
                password: password
            },
            success: function(result){
                if(result.status){
                    $('.error-msg').html('');
                    alert('注册成功！');
                    window.location.reload();
                }else{
                    $('.error-msg').html(result.message);
                }
            }
        });
    })
}