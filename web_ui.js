let WebUI = {};

WebUI.WidgetTypes = {
    UNDEFINED:      "undefined",
    TEXT:           "text",
    IMAGE:          "image",
    PUSH_BUTTON:    "push_button",
    TEXT_FIELD:     "text_field",
    SWITCH:         "switch",
};

WebUI.widgets = [];
WebUI.focused_widget = null;
WebUI.dragged_widget = null;
WebUI.hovered_widget = null;

WebUI.is_mouse_dragging = false;
WebUI.mouse_drag_start = {x:0, y:0};
WebUI.mouse_drag_prev = {x:0, y:0};

WebUI.initialize = function() {
    this.canvas = new fabric.Canvas("c", {
        backgroundColor: "#eee",
        hoverCursor: "default",
        selection: false,
        width: window.innerWidth,
        height: window.innerHeight
    });

    //마우스 핸들러 등록
    $(document).keypress(function(event) {
        WebUI.handleKeyPress(event);
    });
    $(document).mousedown(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        WebUI.handleMouseDown(p);
    });
    $(document).mouseup(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        WebUI.handleMouseUp(p);
    });
    $(document).mousemove(function(event) {
        let p = {x: event.pageX, y: event.pageY};
        WebUI.handleMouseMove(p);
    });

    //
    WebUI.initWidgets();
    WebUI.initVisualItems();
    WebUI.layoutWhenResourceReady();
}

//gui에 필요한 위젯 생성
WebUI.initWidgets = function() {
  WebUI.title = new WebUI.Text("Introduction to HCI");
  WebUI.img_html = new WebUI.Image("resources/HTML5.png", {width:100, height:80});
  WebUI.img_css = new WebUI.Image("resources/CSS3.png", {width:100, height:80});
  WebUI.img_js = new WebUI.Image("resources/JS.png", {width:100, height:80});

  WebUI.text_id = new WebUI.Text("ID");
  WebUI.text_pwd = new WebUI.Text("Password");

  WebUI.edit_id = new WebUI.TextField("", {width:200, height:50});
  WebUI.edit_pwd = new WebUI.TextField("", {width:200, height:50});

  WebUI.btn_ok = new WebUI.PushButton("OK", {width:100, height:50});
  WebUI.btn_cancel = new WebUI.PushButton("Cancel", {width:100, height:50});

  WebUI.text_blah = new WebUI.Text("I want to get A+!");
  WebUI.switch = new WebUI.Switch(false, {width:100, height:50});
}

//각 위젯의 시각적 요소 초기화
WebUI.initVisualItems = function() {
    WebUI.widgets.forEach(widget => {
        widget.initVisualItems();
    });
}

//리소스 로딩 대
WebUI.layoutWhenResourceReady = function() {
    let is_resource_loaded = true;//모든 리소스 준비 됐는지 확인
    for (let i in WebUI.widgets) {
        let widget = WebUI.widgets[i];
        if (!widget.is_resource_ready) {
            is_resource_loaded = false;
            break;
        }
    }

//리소스 준비 안돼어있을 때
    if (!is_resource_loaded) {
        setTimeout(arguments.callee, 50);
    }
    else { //준비 다 됐을 , 로딩된 모든 시각적요소들을 캔버스에 추가시킴
        WebUI.widgets.forEach(widget => {
            widget.visual_items.forEach(item => {
                WebUI.canvas.add(item);
            });
        });
        WebUI.layoutWidgets(); //배치
        WebUI.canvas.requestRenderAll(); //캔버스에 원하는 위치로 배치된 위젯들을 띄움
    }
}

//위젯 배치. 모든 위젯의 리소스가 로딩된 후에 호출.
WebUI.layoutWidgets = function() {
  WebUI.title.moveTo({left:100, top:10});
  WebUI.img_html.moveTo({left:50, top:50});
  WebUI.img_css.moveTo({left:160, top:50});
  WebUI.img_js.moveTo({left:270, top:50});

  WebUI.text_id.moveTo({left:50, top:160});
  WebUI.text_pwd.moveTo({left:50, top:220});
  WebUI.edit_id.moveTo({left:150, top:140});
  WebUI.edit_pwd.moveTo({left:150, top:200});

  WebUI.text_blah.moveTo({left:50, top:300});
  WebUI.switch.moveTo({left:250, top:280});

  WebUI.btn_ok.moveTo({left:50, top:350});
  WebUI.btn_cancel.moveTo({left:160, top:350});

}

//키보드이벤트 전달. 현재 포커스를 가지고있는 위젯이 이벤트 전달
WebUI.handleKeyPress = function(event) {
    let is_handled = false;

    if (WebUI.focused_widget) { //잘 처리했다면
        is_handled = WebUI.focused_widget.handleKeyPress(event);
    }

    if (is_handled) {
        WebUI.canvas.requestRenderAll();
    }
}
//마우스이벤트 전달.
WebUI.handleMouseDown = function(window_p) {
  let is_handled = false;
  if(WebUI.isInCanvas(window_p)){
    let canvas_p = WebUI.transformToCanvasCoords(window_p); //캔버스 좌표

    WebUI.is_mouse_dragging=true;
    WebUI.mouse_drag_start = canvas_p; //드래깅이 시작, 이전좌표를 캔버스 좌표로
    WebUI.mouse_drag_prev = canvas_p;

    let widget = WebUI.findWidgetOn(canvas_p); //눌린곳이 위젯이면 뭔가를 누른 것
    if(widget){
      WebUI.focused_widget = widget;
      if(widget.is_draggable){ //is_draggable이 true면 드래그되는 위젯이다.
        WebUI.dragged_widget = widget;
      }
      else{
        WebUI.dragged_widget=null;
      }
      is_handled = widget.handleMouseDown(canvas_p); //위젯에 구현되어있을 handleMouseDown호출해서 이벤트 전달해라라고 하는 것
    }
    else //마우스 클릭했는데 위젯이 어디에도 걸쳐져있지 않을 때
    {
      WebUI.focused_widget = null;
      WebUI.dragged_widget = null;
    }
  }
  else{ //클릭한 장소가 캔버스 아예 밖에서 클릭됐을 때
    WebUI.is_mouse_dragging = false;
    WebUI.mouse_drag_start = {x:0, y:0};
    WebUI.mouse_drag_prev = {x:0, y:0};

    WebUI.focused_widget = null;
    WebUI.dragged_widget = null;
  }

  if(is_handled){
    WebUI.canvas.requestRenderAll();
  }
}

WebUI.handleMouseMove = function(window_p) {
  let is_handled = false;
  let canvas_p = WebUI.transformToCanvasCoords(window_p);

  let widget = WebUI.findWidgetOn(canvas_p); //밑에 위젯이 있는지
  if(widget != WebUI.hovered_widget) //새로 발견된 위젯이 이전에 호버링되있던 위젯과 다르다면
  {
    if(WebUI.hovered_widget != null){
      is_handled = is_handled || WebUI.hovered_widget.handleMouseExit(canvas_p); //이전 위젯에게 마우스 빠져나갔다고 전달
    }
    if(widget != null)
    {
      is_handled = is_handled || widget.handleMouseEnter(canvas_p);
    }
    WebUI.hovered_widget = widget; //새로운 위젯이 호버링된 위젯이다.
  }
  else{ //같은 위젯 내부에서 이동한 때
    if(widget){
      is_handled = widget.handleMouseMove(canvas_p);
    }
  }
  if(WebUI.is_mouse_dragging){ //현재 마우스가 드래깅상태인가
    if(WebUI.dragged_widget != null){ //드래깅된 위젯이 잇으면
      let tx = canvas_p.x - WebUI.mouse_drag_prev.x;
      let ty = canvas_p.y - WebUI.mouse_drag_prev.y;
      WebUI.dragged_widget.translate({x:tx, y:ty});

      is_handled=true;
    }
    WebUI.mouse_drag_prev = canvas_p;
  }
  if(is_handled){
    WebUI.canvas.requestRenderAll();
  }
}

WebUI.handleMouseUp = function(window_p) {
  let is_handled = false;
  let canvas_p = WebUI.transformToCanvasCoords(window_p);

  let widget = WebUI.findWidgetOn(canvas_p);
  if(widget){ //위젯이 있으면 마우스 올라갔다고 알려줌
    is_handled = widget.handleMouseUp(canvas_p);
  }
  if(WebUI.is_mouse_dragging){
    WebUI.is_mouse_dragging = false;
    WebUI.mouse_drag_start = {x:0, y:0};
    WebUI.mouse_drag_prev = {x:0, y:0};

    is_handled = true;
  }
  if(is_handled){
    WebUI.canvas.requestRenderAll();
  }
}

//윈도우 좌표계를 캔버스 좌표계
WebUI.transformToCanvasCoords = function(window_p) {
    let rect = WebUI.canvas.getElement().getBoundingClientRect();
    let canvas_p = {
        x : window_p.x - rect.left,
        y : window_p.y - rect.top
    };
    return canvas_p;
}

//주어진 윈도우 좌표계의 좌표값이 캔버스 내부에 있으면 true
WebUI.isInCanvas = function(window_p) {
    let rect = WebUI.canvas.getElement().getBoundingClientRect(); //캔버스의 경계사각형 구함
    if (window_p.x >= rect.left &&  //캔버스가 윈도우 안에 있는가?
        window_p.x < rect.left + rect.width &&
        window_p.y >= rect.top &&
        window_p.y < rect.top + rect.height) {
        return true;
    }
    else {
        return false;
    }
}

//주어진 캔버스 좌표가 마우스 커서의 좌표라고 한다면 그 좌표값이 어떤 특정 위젯 내부에 있는지 판단
WebUI.findWidgetOn = function(canvas_p) {
  let x=canvas_p.x;
  let y=canvas_p.y;

  for(let i =0; i<this.widgets.length; i++){ //모든 위젯에 대해서 검사
    let widget = this.widgets[i];

    if(x>=widget.position.left && x<=widget.position.left + widget.size.width && y>=widget.position.top && y<=widget.position.top + widget.size.height){
      return widget;
    }
  }
  return null;
}

//
WebUI.Widget = function() { //생성자에 해당. this를 통해 생성자를 호출할 때 새롭게 만들어진 객체에 저장이 되도록
  this.type = WebUI.WidgetTypes.UNDEFINED;

  this.parent = null;
  this.children =[];

  this.position = {left:0, top:0};
  this.size = {width:0, height:0};

  this.is_draggable = false;
  this.is_movable = true;
  this.visual_items = [];
  this.is_resource_ready = false;
  WebUI.widgets.push(this); //새롭게 생성된 this가 위젯배열에 추가되도록.
}

WebUI.Widget.prototype.initVisualItems = function() {
}

WebUI.Widget.prototype.moveTo = function(p) { //목적지 위치를 인자로 전달
    if(!this.is_movable)
    {
        return;
    }

    let tx = p.left - this.position.left; //현재지점과 해당지점의 차이 x좌표
    let ty = p.top - this.position.top;

    this.translate({x: tx, y: ty});
}

WebUI.Widget.prototype.translate = function(v) { //현재위치로부터 상대적으로 얼마만큼 이동해라를 전달
  if(!this.is_movable)
  { return;}
  this.position.left += v.x; //객체의 위치를 전달된 변화량만큼 이동
  this.position.top += v.y;
  this.visual_items.forEach(item => {
    item.left +=v.x;
    item.top +=v.y;
  });
  this.children.forEach(child_widget =>{ //자식위젯도 부모와 동등한 위치만큼 이동
    child_widget.translate(v);
  });
}

WebUI.Widget.prototype.destroy = function() { //위젯이 소멸될 때
  //이 위젯이 webui와 상호작용중인 것인가?
    if (this == WebUI.focused_widget) WebUI.focused_widget = null;
    if (this == WebUI.dragged_widget) WebUI.dragged_widget = null;
    if (this == WebUI.hovered_widget) WebUI.hovered_widget = null;
  //비쥬얼 아이템이 있는 모든 요소들을 캔버스에서 제거해라
    this.visual_items.forEach(item => {
        WebUI.canvas.remove(item);
    });
    this.visual_items = [];
  // widgets 배열에서 삭제
    let index = WebUI.widgets.indexOf(this);
    if(index > -1)
    {
        WebUI.widgets.splice(index, 1); //splice 사용법 찾아보기
    }
  //현재위젯이 자식이 있었다면, 모든 자식들에 대해서도 destroy
    this.children.forEach(child_widget => {
        child_widget.destroy();
    });
    this.children = [];
}

WebUI.Widget.prototype.handleKeyPress = function(event) {
    return false;
}

WebUI.Widget.prototype.handleMouseDown = function(canvas_p) {
    return false;
}

WebUI.Widget.prototype.handleMouseMove = function(canvas_p) {
    return false;
}

WebUI.Widget.prototype.handleMouseUp = function(canvas_p) {
    return false;
}

WebUI.Widget.prototype.handleMouseEnter = function(canvas_p) {
    return false;
}

WebUI.Widget.prototype.handleMouseExit = function(canvas_p) {
    return false;
}

//
WebUI.Text = function(label) { //인자로 어떤 내용을 출력할 것인지
  WebUI.Widget.call(this);
  this.type = WebUI.WidgetTypes.TEXT; //디폴트값이 undefined니까 타입 지정
  this.label = label;

  this.font_family = 'System';
  this.font_size = 20;
  this.font_weight = 'bold';
  this.text_align = 'left';
  this.text_color = 'black';
}
WebUI.Text.prototype = Object.create(WebUI.Widget.prototype);
WebUI.Text.prototype.constructor  = WebUI.Text;

WebUI.Text.prototype.initVisualItems = function(){
  let text = new fabric.Text(this.label,{ //텍스트객체를 만듬. 객체에 저장되있는 레이블을 그대로 전달
    left: this.position.left,
    top:  this.position.top,
    selectable: false, //이게 참으로되있으면 fabric 라이브러리 자체에서 이 객체들을 선택할 수 있음. 그럼 충돌할 수 있음.
    fontFamily: this.font_family,
    fontSize: this.font_size,
    fontWeight: this.font_weight,
    textAlign:  this.text_align,
    stroke: this.text_color,
    fill: this.text_color
  });
  let bound = text.getBoundingRect(); //글자 주위에 텍스트를 둘러싼 작은 사각형
  this.position.left = bound.left;
  this.position.top = bound.top;
  this.size.width = bound.width;
  this.size.height = bound.height;
  this.visual_items.push(text); //추가해주고
  this.is_resource_ready = true; //만드는 즉시 사용가능하기때문에 true
}
//
WebUI.Image = function(path, desired_size) { //이미지 위젯 생성
    WebUI.Widget.call(this);

    this.type = WebUI.WidgetTypes.IMAGE;
    this.path = path;
    this.desired_size = desired_size;
}

WebUI.Image.prototype = Object.create(WebUI.Widget.prototype);
WebUI.Image.prototype.constructor = WebUI.Image;

WebUI.Image.prototype.initVisualItems = function() {
  let widget = this;
  fabric.Image.fromURL(this.path, function(img){ //콜백함수. 함수 호출하자마자 이미지 생성되는게 아니라 그 이후 어느시점에 생성되서 this가 의미가 없어서 따로 저장해둔거
    if(widget.desired_size != undefined){
      img.scaleToWidth(widget.desired_size.width);
      img.scaleToHeight(widget.desired_size.height);
      widget.size = widget.desired_size;
    }
    else {
      widget.size = {width:img.width, height:img.height};
    }
    img.set({
      left:widget.position.left,
      top:widget.position.top,
      selectable:false});
  widget.visual_items.push(img);
  widget.is_resource_ready = true;
});
}

//
WebUI.TextField = function(label, desired_size) {
    WebUI.Widget.call(this);

    this.type = WebUI.WidgetTypes.TEXT_FIELD;
    this.label = label;
    this.desired_size = desired_size;
    this.margin = 10;

    this.stroke_color = 'black';
    this.fill_color = 'white';
    this.stroke_width = 5;

    this.font_family = 'System';
    this.font_size = 20;
    this.font_weight = 'normal';
    this.text_align = 'left';
    this.text_color = 'black';
}

WebUI.TextField.prototype = Object.create(WebUI.Widget.prototype);
WebUI.TextField.prototype.constructor = WebUI.TextField;

WebUI.TextField.prototype.initVisualItems = function() {
  let boundary = new fabric.Rect({ //글자상자 주변 경계사각형
    width:  this.desired_size.width,
    height: this.desired_size.height,
    fill: this.fill_color,
    stroke: this.stroke_color,
    strokeWidth:  this.stroke_width,
    selectable: false
  });
  let textbox = new fabric.Textbox(this.label, {
    left: this.margin,
    fontFamily: this.font_family,
    fontSize: this.font_size,
    fontWeight: this.font_weight,
    textAlign:  this.text_align,
    stroke: this.text_color,
    fill: this.text_color,
    selectable: false
  });

  let bound = textbox.getBoundingRect();
  textbox.top = this.position.top + (this.desired_size.height - bound.height)/2;
  this.size = this.desired_size;
  this.visual_items.push(boundary);
  this.visual_items.push(textbox);
  this.is_resource_ready = true;
}

WebUI.TextField.prototype.handleMouseDown = function(canvas_p) {
    let textbox = this.visual_items[1];
    textbox.enterEditing();

    return true;
}

WebUI.TextField.prototype.handleKeyPress = function(event) {
    let boundary = this.visual_items[0];
    let textbox = this.visual_items[1];

    let new_label = textbox.text;
    let old_label = this.label;
    this.label = new_label;

    if (event.keyCode == 13) {//13이 엔터키
        let text_enter_removed = new_label.replace(/(\r\n|\n|\r)/gm, "");//새롭게 입력된 레이블에 엔터키에 해당하는것을 지우는 것.
        textbox.text = text_enter_removed; //텍스트박스에 히든에어리어가 있는데 거기까지 바꿔야
        this.label = text_enter_removed;

        if (textbox.hiddenTextarea != null) {
            textbox.hiddenTextarea.value = text_enter_removed;
        }

        textbox.exitEditing();

        return true;
    }
//텍스트박스 상자 외곽을 벗어나면 더이상 입력되지 않도록
    if (old_label != new_label && old_label.length < new_label.length) {
        let canvas = document.getElementById("c");
        let context = canvas.getContext("2d");
        context.font = this.font_size.toString() + "px " + this.font_family;

        let boundary_right = boundary.left + boundary.width - this.margin;
        let text_bound = textbox.getBoundingRect();
        let text_width = context.measureText(new_label).width;
        let text_right = text_bound.left + text_width;

        if (boundary_right < text_right) {
            textbox.text = old_label;
            this.label = old_label;

            if (textbox.hiddenTextarea != null) {
                textbox.hiddenTextarea.value = old_label;
            }
            return true;
        }
    }
    return false;
}

//
WebUI.PushButton = function(label, desired_size) { //푸쉬버튼 생성자
    WebUI.Widget.call(this);

    this.type = WebUI.WidgetTypes.PUSH_BUTTON;
    this.label = label;
    this.desired_size = desired_size;
    this.is_pushed = false;

    this.stroke_color = 'black';
    this.fill_color = 'white';

    this.font_family = 'System';
    this.font_size = 20;
    this.font_weight = 'bold';
    this.text_align = 'center';
    this.text_color = 'black';
}

WebUI.PushButton.prototype = Object.create(WebUI.Widget.prototype);
WebUI.PushButton.prototype.constructor = WebUI.PushButton;

WebUI.PushButton.prototype.initVisualItems = function() {
    let background = new fabric.Rect({ //버튼의 백그라운드 될 사각형 생성
        left: this.position.left,
        top: this.position.top,
        width: this.desired_size.width,
        height: this.desired_size.height,
        fill: this.fill_color,
        stroke: this.stroke_color,
        strokeWidth: 1,
        selectable: false
    });

    let text = new fabric.Text(this.label, { //버튼의 텍스트 생
        left: this.position.left,
        top: this.position.top,
        selectable: false,
        fontFamily: this.font_family,
        fontSize:   this.font_size,
        fontWeight: this.font_weight,
        textAlign:  this.text_align,
        stroke:     this.text_color,
        fill:       this.text_color,
    });

//텍스트 객체가 가운데에 오게함
    let bound = text.getBoundingRect();
    text.left = this.position.left + this.desired_size.width/2 - bound.width/2;
    text.top = this.position.top + this.desired_size.height/2 - bound.height/2;

    this.size = this.desired_size;

    this.visual_items.push(background);
    this.visual_items.push(text);
    this.is_resource_ready = true;
}

WebUI.PushButton.prototype.handleMouseDown = function() {
  if(!this.is_pushed){
    this.translate({x:0, y:5}); //마우스 눌렀을 때 조금 아래로 움직임
    this.is_pushed=true;

    if(this.onPushed != undefined){ //이벤트핸들러 등록되있으면 호출
      this.onPushed.call(this);
    }
    return true;
  }
  else{
    return false;
  }
}

WebUI.PushButton.prototype.handleMouseUp = function() {
  if(this.is_pushed){
    this.translate({x:0, y:-5});
    this.is_pushed = false;
    return true;
  }
  else{
    return false;
  }
}

WebUI.PushButton.prototype.handleMouseEnter = function() { // 마우스 올려졌을 때
  this.visual_items[0].set('strokeWidth', 3); //두껍게
  return true;
}

WebUI.PushButton.prototype.handleMouseExit = function() { //마우스 나갔을 때
  this.visual_items[0].set('strokeWidth', 1);
  if(this.is_pushed){ //버튼이 눌린상태에서 나갔을 때
    this.translate({x:0, y:-5});
    this.is_pushed =false;
  }
  return true;
}

WebUI.Switch = function(is_on, desired_size) {
  WebUI.Widget.call(this);
  this.type = WebUI.WidgetTypes.SWITCH;
  this.is_on = is_on;
  this.desired_size = desired_size;
}

WebUI.Switch.prototype = Object.create(WebUI.Widget.prototype);
WebUI.Switch.prototype.constructor = WebUI.Switch;
//꺼진상태 rgb(142,142,147), 켜진상태 rgb(48,209,88)
WebUI.Switch.prototype.initVisualItems = function() {
  let r = this.desired_size.width/4;
  let path = new fabric.Path('M r 0 L 75 0 A 25 25 0 0 1 75 50 L 75 50L 25 50 A 25 25 50 0 75 25 0z');
  let circle = new fabric.Circle({
    radius:0.9*r,
    fill:'white',
    top:this.position.top+2,
    left:this.position.left+2,
    selectable:false,
  });
  path.set({fill:'rgb(142,142,147)',
  stroke:'rgb(142,142,147)',
  top:this.position.top,
  left:this.position.left,
  selectable: false
  });

  this.size = this.desired_size;
  this.visual_items.push(path);
  this.visual_items.push(circle);
  this.is_resource_ready = true;
}

WebUI.Switch.prototype.handleMouseDown = function () {
  if(!this.is_on)
  {
    this.visual_items[1].animate('left', '+=50', {
      onChange:WebUI.canvas.renderAll.bind(WebUI.canvas),
      duration: 100,
    });
    this.is_on = true;
    this.visual_items[0].set('fill', 'rgb(48,209,88)');
    this.visual_items[0].set('stroke', 'rgb(48,209,88)');
    this.visual_items[1].set('stroke', 'rgb(48,209,88)');
    return true;
  }
  else
  {
    this.visual_items[1].animate('left', '-=50', {
      onChange:WebUI.canvas.renderAll.bind(WebUI.canvas),
      duration: 100,
    });
  }
  this.is_on = false;
  this.visual_items[0].set('fill', 'rgb(142,142,147)');
  this.visual_items[0].set('stroke', 'rgb(142,142,147)');
  this.visual_items[1].set('stroke', 'rgb(142,142,147)');
  return false;
}

$(document).ready(function() {
    WebUI.initialize();
});
