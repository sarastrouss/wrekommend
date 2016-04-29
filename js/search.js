function clear(field, value) {
	if(field.value == value) {
		field.value = " ";
	}
}

function recall(field,value) {
	if(field.value == " ") {
		field.value = value;
	}
}