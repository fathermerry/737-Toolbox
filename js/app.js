function addClass(el, className) {
    if (el.classList)
        el.classList.add(className);
    else
        el.className += ' ' + className;
}

function removeClass(el, className) {
    if (el.classList)
        el.classList.remove(className);
    else
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
}

function isDescendant(parent, child) {
    var node = child.parentNode;
    while (node != null) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

var toggles = document.getElementsByClassName('header_toggle');
var actions = document.getElementsByClassName('action-button');
var renders = document.getElementsByClassName('render-button');
var forms = document.getElementsByTagName("form");
var create_div = document.getElementById('create');
var saved_div = document.getElementById('saved');
var saved_list = document.getElementById('saved-list');
var saved_records = document.getElementsByClassName('saved-record');
var view_record = document.getElementById('view-record');
var view_record_form = document.getElementById('view-record-form');
var render_div = document.getElementById('render');
var code_div = document.getElementById('code');
var call_link = document.getElementById('call-link');
var copy_link = document.getElementById('copy-link');
var storage = localStorage.getItem('737-numbers') || '[]';
var database = JSON.parse(storage);
var active_record;

// Parse storage
function populateRecords() {
    saved_list.innerHTML = "";

    if (database.length == 0) {
        var no_content = "<div class='empty'><i class='ion-drag'></i><p>No saved numbers</p> <span>When you generate a code, you have an option to save locally to your device</div>";
        saved_list.insertAdjacentHTML('beforeend', no_content);
        return;
    }

    for (var i = 0; i < database.length; i++) {
        var saved = database[i];
        var html = '<li class="list-group-item smaller saved-record" data-index="' + i + '" onclick="openRecord(this)">';
        if (saved.type == 'account') {
            html += '<i class="list-group-icon ion-android-radio-button-off"></i> <i class="list-group-next ion-chevron-right"></i> ';
            html += (saved.is_gtb ? 'GTB: ' : 'NON-GTB: ') + saved.name + '<span class="helper">';
            html += saved.number + '</span></li>'
        } else if (saved.type == 'phone') {
            html += '<i class="list-group-icon ion-iphone"></i> <i class="list-group-next ion-chevron-right"></i> ';
            html += 'Phone: ' + saved.name + '<span class="helper">' + saved.number + '</span></li>';
        }
        saved_list.insertAdjacentHTML('beforeend', html);
    }
}
populateRecords();

if('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log("Service Worker Registered"); });
}

function openRecord(element) {
    var index = element.getAttribute('data-index');
    active_record = database[index];
    active_record.index = index;
    view_record_form.style.display = "";
    addClass(view_record, 'visible');
    addClass(element, 'active');

    var text = "How much" + (active_record.type == 'phone' ? " airtime" : "") + " do you want to send to ";
    text += active_record.name + " (" + active_record.number + ")";
    document.getElementById('view-record-title').innerHTML = text;

    setTimeout(function() {
        var close_button = document.getElementById('close-view-record');
        close_button.addEventListener('click', closeRecord);
    }, 500);
}

function closeRecord() {
    addClass(view_record, 'exiting');
    setTimeout(function() {
        removeClass(view_record, 'exiting');
        removeClass(view_record, 'visible');
    }, 500);

    for (var i = 0; i < saved_records.length; i++) {
        removeClass(saved_records[i], 'active');
    }

    document.getElementById('amount-to-credit').value = "";
    document.getElementById('close-view-record').removeEventListener('click', closeRecord);
}

// Delete record
document.getElementById('delete-saved').addEventListener('click', function() {
    database.splice(active_record.index, 1);
    closeRecord();

    localStorage.setItem('737-numbers', JSON.stringify(database));
    removeItem(active_record.index);
})

function removeItem(index) {
    var saved_record = document.querySelectorAll('[data-index="' + index + '"]')[0];
    addClass(saved_record, 'exiting');
    setTimeout(populateRecords, 500);
}

// Switch screens
for (var i = 0; i < toggles.length; i++) {
    toggles[i].addEventListener('click', function() {
        document.getElementById('toggle-create').innerHTML = "Create";

        for (var i = 0; i < toggles.length; i++) {
            removeClass(toggles[i], 'active');
        }
        addClass(this, 'active');

        var inputs = document.getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].value = "";
        }

        for (var i = 0; i < actions.length; i++) {
            removeClass(actions[i], 'active');
        }

        if (this.getAttribute('id') == 'toggle-create') {
            removeClass(create_div, 'screen-two');

            if (create_div.style.display == "none") {
                create_div.style.display = 'block';
                saved_div.style.display = 'none';
            }
        } else {
            create_div.style.display = 'none';
            saved_div.style.display = 'block';
        }

        setTimeout(function() {
            for (var i = 0; i < forms.length; i++) {
                forms[i].style.display = "none";
            }
        }, 500);
    });
}

// Click to show screens
for (var i = 0; i < actions.length; i++) {
    actions[i].addEventListener('click', function() {
        var tab = document.getElementById('toggle-create');
        tab.innerHTML = "<i class='ion-android-arrow-back' style='margin-right: 20px'></i> Back";

        addClass(this, 'active');
        addClass(create_div, 'screen-two');
        var form_to_show = document.getElementById(this.getAttribute('data-form'));
        form_to_show.style.display = 'block';
    });
}

for (var i = 0; i < renders.length; i++) {
    renders[i].addEventListener('click', function() {
        var code = this.getAttribute('data-code');
        render(code);
    });
}

// On form submit
for (var i = 0; i < forms.length; i++) {
    forms[i].addEventListener('submit', function(e) {
        e.preventDefault();
        generate(this);
    });
}

function toggle(id) {
    var div = document.getElementById(id);
    div.style.display = div.style.display.length ? "" : "none";
}

function generate(form) {
    var tool = form.getAttribute('tool');

    switch (tool) {
        case 'transfer':
            var account_number = document.getElementById('account-number').value;
            var is_gtb = document.getElementById('is-gtb-account').checked;
            var amount = document.getElementById('amount-to-account').value;
            var to_save = document.getElementById('save-account-number').checked;
            var account_name = document.getElementById('account-name').value;

            var prefix = is_gtb ? "*737*1*" : "*737*2*";
            var code = prefix + amount + "*" + account_number + "#";
            render(code);

            if (to_save && account_name) {
                save({
                    type: 'account',
                    name: account_name,
                    number: account_number,
                    is_gtb: is_gtb
                });
            }
            break;
        case 'airtime':
            var phone_number = document.getElementById('phone-number').value;
            var amount = document.getElementById('amount-to-number').value;
            var to_save = document.getElementById('save-phone-number').checked;
            var phone_name = document.getElementById('phone-name').value;

            var prefix = "*737*";
            var code = prefix + amount + "*" + phone_number + "#";
            render(code);

            if (to_save && phone_name) {
                save({
                    type: 'phone',
                    name: phone_name,
                    number: phone_number
                });
            }
            break;
        case 'airtime_self':
            var amount = document.getElementById('amount-to-buy').value;
            var prefix = "*737*";
            var code = prefix + amount + "#";
            render(code);
            break;
        case 'saved':
            var amount = document.getElementById('amount-to-credit').value;
            closeRecord();
            if (active_record.type == 'account') {
                var prefix = active_record.is_gtb ? "*737*1*" : "*737*2*";
                var code = prefix + amount + "*" + active_record.number + "#";
                render(code);
            } else if (active_record.type == 'phone') {
                var prefix = "*737*";
                var code = prefix + amount + "*" + active_record.number + "#";
                render(code);
            };
            break;
    }
}

function render(code) {
    code_div.value = code;
    call_link.href = "tel:" + encodeURIComponent(code);
    addClass(render_div, 'visible');
    var close_button = document.getElementById('close-render');

    var clipboard = new Clipboard('#copy-link', {
        text: function() {
            return code
        }
    });

    clipboard.on('success', function(e) {
        copy_link.innerHTML = "Copied!";
        setTimeout(function() {
            copy_link.innerHTML = "Copy";
        }, 1000);
    });

    clipboard.on('error', function() {
        code_div.select();
        code_div.focus();
        code_div.selectionStart = 0;
        code_div.selectionEnd = 999;
    })

    setTimeout(function() {
        close_button.addEventListener('click', closeRender);
    }, 500);

    function closeRender(e) {
        addClass(render_div, 'exiting');
        var _timeout = setTimeout(function() {
            removeClass(render_div, 'visible');
            removeClass(render_div, 'exiting');
            clearTimeout(_timeout);
        }, 500);
        close_button.removeEventListener('click', closeRender);
    }
}

function save(number) {
    database.unshift(number);
    localStorage.setItem('737-numbers', JSON.stringify(database));
    populateRecords();
}
