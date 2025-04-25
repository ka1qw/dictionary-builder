
const columns = [];

const typeLabels = {
    StringField: "Строка",
    TextField: "Текст",
    DateField: "Дата",
    DatetimeField: "Дата и время",
    BoolField: "Логическое",
    IntField: "Целое число",
    DecimalField: "Число"
};

// Обработчик изменения типа данных
document.getElementById("type").addEventListener("change", function() {
    const lengthField = document.getElementById("length");
    if (this.value === "StringField") {
    lengthField.disabled = false;
    lengthField.placeholder = "1 - 20000";
    } else {
    lengthField.disabled = true;
    lengthField.value = "";
    lengthField.placeholder = "Только для типа Строка (StringField)";
    }
});

// Функция для показа уведомления
function showNotification(elementId, message = '', duration = 3500) {
    const notification = document.getElementById(elementId);
    
    // Скрываем все уведомления перед показом нового
    document.querySelectorAll('.notification.show').forEach(el => {
    el.classList.remove('show');
    });
    
    if (elementId === 'errorNotification') {
    const errorMessageElement = document.getElementById('errorMessage');
    errorMessageElement.innerHTML = message.replace(/\n/g, '<br>');
    
    if (message.includes("Системное имя должно:") || message.includes("Системное имя справочника должно:")) {
        duration = 5000;
    }
    } else if (message) {
    // Для других уведомлений устанавливаем текст, если он передан
    notification.querySelector('span').textContent = message;
    }
    
    notification.classList.add('show');
    setTimeout(() => {
    notification.classList.remove('show');
    }, duration);
}

// Функция для сброса ошибок валидации
function resetValidationErrors() {
    document.querySelectorAll('input.error, select.error').forEach(el => {
    el.classList.remove('error');
    });
}

// Обработчик для кнопки "Добавить столбец"
document.getElementById("add-column-btn").addEventListener("click", function() {
    const success = addColumn();
    if (success) {
    showNotification('notification', 'Столбец добавлен');
    }
});

// Обработчик для кнопки "Копировать"
document.getElementById("copy-btn").addEventListener("click", function() {
    const codeOutput = document.getElementById("code-output");
    codeOutput.select();
    document.execCommand('copy');
    showNotification('copyNotification', 'Текст скопирован в буфер обмена');
});

// Обработчик для "Выбрать все"
document.getElementById("select-all").addEventListener("change", function() {
    const checkboxes = document.querySelectorAll('#columns-table tbody input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
    checkbox.checked = this.checked;
    });
    updateDeleteButtonState();
});

// Обработчики для модального окна подтверждения
document.getElementById("delete-columns-btn").addEventListener("click", function() {
    document.getElementById("confirmModal").classList.add("show");
});

document.getElementById("cancelDelete").addEventListener("click", function() {
    document.getElementById("confirmModal").classList.remove("show");
});

document.getElementById("confirmDelete").addEventListener("click", function() {
    document.getElementById("confirmModal").classList.remove("show");
    deleteSelectedColumns();
});

function isValidSystemName(name) {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name) && !/^\d+$/.test(name) && !name.includes(" ");
}

function addColumn() {
    resetValidationErrors();
    
    const name = document.getElementById("name").value.trim();
    const displayName = document.getElementById("displayName").value.trim();
    const type = document.getElementById("type").value;
    const length = document.getElementById("length").value;
    const colSpan = parseInt(document.getElementById("colSpan").value);

    let hasError = false;

    if (!name) {
    document.getElementById("name").classList.add('error');
    hasError = true;
    }

    if (!displayName) {
    document.getElementById("displayName").classList.add('error');
    hasError = true;
    }

    if (!type) {
    document.getElementById("type").classList.add('error');
    hasError = true;
    }

    if (hasError) {
    showNotification('errorNotification', 'Заполните все обязательные поля (помечены *)');
    return false;
    }

    if (!isValidSystemName(name)) {
    document.getElementById("name").classList.add('error');
    showNotification('errorNotification', 'Системное имя должно:\n• Начинаться с буквы\n• Содержать только латиницу, цифры и подчёркивания\n• Не быть числом\n• Не содержать пробелы');
    return false;
    }

    if (columns.some(col => col.name === name)) {
    document.getElementById("name").classList.add('error');
    showNotification('errorNotification', 'Системное имя столбца должно быть уникальным');
    return false;
    }

    if (type === "StringField" && (isNaN(length) || length <= 0 || length > 20000)) {
    document.getElementById("length").classList.add('error');
    showNotification('errorNotification', 'Для StringField длина должна быть от 1 до 20000 символов');
    return false;
    }

    if (isNaN(colSpan) || colSpan <= 0 || colSpan > 12) {
    document.getElementById("colSpan").classList.add('error');
    showNotification('errorNotification', 'Ширина (colSpan) должна быть числом от 1 до 12');
    return false;
    }

    if (name.length > 300 || displayName.length > 300) {
    showNotification('errorNotification', 'Слишком длинное имя — максимум 300 символов');
    return false;
    }

    columns.push({ 
    name, 
    displayName, 
    type, 
    length: type === "StringField" ? parseInt(length) : null, 
    colSpan 
    });
    renderColumns();

    document.getElementById("name").value = "";
    document.getElementById("displayName").value = "";
    document.getElementById("length").value = "";
    
    return true;
}

function renderColumns() {
    const tbody = document.querySelector("#columns-table tbody");
    tbody.innerHTML = "";
    columns.forEach((col, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td class="checkbox-col"><input type="checkbox" data-index="${index}" onchange="updateDeleteButtonState()"></td>
        <td>${col.name}</td>
        <td>${col.displayName}</td>
        <td>${typeLabels[col.type]} (${col.type})</td>
        <td style="padding-left: 8.5px; text-align: center">${col.type === "StringField" ? col.length : "—"}</td>
        <td>${col.colSpan}</td>
    `;
    tbody.appendChild(row);
    });

    updateDeleteButtonState();
}

function updateDeleteButtonState() {
    const checkboxes = document.querySelectorAll('#columns-table tbody input[type="checkbox"]');
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    document.getElementById("delete-columns-btn").disabled = !anyChecked;
    
    // Обновляем состояние "Выбрать все"
    const selectAll = document.getElementById("select-all");
    selectAll.checked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
}

function deleteSelectedColumns() {
    const checkboxes = document.querySelectorAll('#columns-table tbody input[type="checkbox"]');
    const toDelete = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => parseInt(cb.dataset.index));

    if (toDelete.length === 0) return;

    for (let i = toDelete.length - 1; i >= 0; i--) {
    columns.splice(toDelete[i], 1);
    }
    renderColumns();
    document.getElementById("select-all").checked = false;
    showNotification('notification', 'Выбранные столбцы удалены');
}

function generateCode() {
    resetValidationErrors();
    
    const dictName = document.getElementById("dictName").value.trim();
    const dictDisplayName = document.getElementById("dictDisplayName").value.trim();

    if (!dictName) {
    document.getElementById("dictName").classList.add('error');
    showNotification('errorNotification', 'Введите системное имя справочника');
    return;
    }

    if (!dictDisplayName) {
    document.getElementById("dictDisplayName").classList.add('error');
    showNotification('errorNotification', 'Введите отображаемое имя справочника');
    return;
    }

    if (!isValidSystemName(dictName)) {
    document.getElementById("dictName").classList.add('error');
    showNotification('errorNotification', 'Системное имя справочника должно:\n• Начинаться с буквы\n• Содержать только латиницу, цифры и подчёркивания\n• Не быть числом\n• Не содержать пробелы');
    return;
    }

    if (dictName.length > 300 || dictDisplayName.length > 300) {
    showNotification('errorNotification', 'Слишком длинное имя справочника — максимум 300 символов');
    return;
    }

    if (columns.length === 0) {
    showNotification('errorNotification', 'Добавьте хотя бы один столбец');
    return;
    }

    const imports = new Set(['import org.zenframework.z8.base.table.Table;']);
    const withImport = document.getElementById("withImport").checked;
    const withClear = document.getElementById("withClear").checked;

    if (withImport) imports.add('import pro.doczilla.dictionary.importFile.CsvDictionaryImportAction;');
    if (withClear) imports.add('import pro.doczilla.dictionary.action.ClearAction;');

    const fieldsCode = columns.map(col => {
    imports.add(`import org.zenframework.z8.base.table.value.${col.type};`);
    let fieldCode = `
[name "${col.name}"]
[displayName "${col.displayName}"]
public ${col.type} ${col.name};`;
    
    // Добавляем длину только для StringField
    if (col.type === "StringField") {
        fieldCode += `
${col.name}.length = ${col.length};`;
    }
    
    fieldCode += `
${col.name}.colSpan = ${col.colSpan};`;
    
    return fieldCode;
    });

    const fieldNames = columns.map(c => c.name).join(', ');

    const actionsBlock = (() => {
    const actions = [];
    if (withClear) actions.push('clearAction');
    if (withImport) actions.push('importAction');
    if (actions.length === 0) return '';
    return `
${withImport ? 'CsvDictionaryImportAction importAction;' : ''}
${withClear ? 'ClearAction clearAction;' : ''}
actions = {${actions.join(', ')}};`;
    })();

    const result = `
${[...imports].sort().join('\n')}

[generatable]
[dictionary]
[request true]
[name "${dictName}"]
[displayName "${dictDisplayName}"]
public class ${dictName} extends Table {

${fieldsCode.join('\n\n')}

columns = {${fieldNames}};
controls = {${fieldNames}};${actionsBlock ? '\n' + actionsBlock : ''}
}
`;

    document.getElementById("code-output").value = result.trim();
    showNotification('notification', 'Код успешно сгенерирован');
}

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", function() {
    const typeSelect = document.getElementById("type");
    const lengthField = document.getElementById("length");
    
    if (typeSelect.value !== "StringField") {
    lengthField.disabled = true;
    lengthField.placeholder = "Только для StringField";
    }
});
