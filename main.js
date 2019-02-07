//Основная функция игры, которая запускается сразу при прогрузке страницы
function Game(){
    var canvas = document.getElementById('screen')
    var context = setupCanvas(canvas)

    var field_size = 9
    var game_scene = 'main_menu'

    var game_screen = []
    var main_menu = []

    var game_objects = []
    var playfield
    var avialable_combinations = []

    var level = 1200
    var bar_length = 410
    var bar_speed = bar_length / level
    var scores = 0
    var bar_scores = 0
    var time = 30

    var colors = [
        'red',
        'green',
        'blue',
        'yellow',
        'purple'
    ]

    function setupCanvas(canvas) {
        var dpr = window.devicePixelRatio || 1
        var rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        var ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        return ctx
    }

    function createSprite(src){
        var sprite = new Image()
        sprite.src = src
        return sprite
    }

    //Функция прорисовки спрайтов в зависимости от их типа. Позже все будет сведено к рисованию 
    //лишь одного типа спрайтов для упрощения работы программы и ее общей архитектуры
    function Draw(objects){
        for(var i=0; i < objects.length; i++){
            if(objects[i].type == 'rect'){
                context.beginPath()
                context.rect(
                    objects[i].x, 
                    objects[i].y, 
                    objects[i].width, 
                    objects[i].height)
                context.fillStyle = objects[i].color
                context.fill()
            }

            if(objects[i].type == 'sprite'){
                var current_state = objects[i].current_state
                var state_data = objects[i].states[current_state]
                    context.drawImage(
                        state_data.image,
                        state_data.current_frame * state_data.width / state_data.number_of_frames,
                        0,
                        state_data.width / state_data.number_of_frames,
                        state_data.height,
                        objects[i].x,
                        objects[i].y,
                        state_data.width / state_data.number_of_frames,
                        state_data.height,
                    )
            } else if(objects[i].type == 'static_sprite'){
                var current_state = objects[i].current_state
                var state_data = objects[i].states[current_state]
                state_data.width = objects[i].name == 'timebar_mid' ? bar_scores * bar_speed : state_data.width
                context.drawImage(
                    state_data.image,
                    objects[i].x, 
                    objects[i].y,
                    state_data.width,
                    state_data.height,
                )
            }

            if(objects[i].name == 'button'){
                context.fillStyle = "white"
                context.font = objects[i].text_font;
                context.fillText(objects[i].text, objects[i].x + objects[i].text_x, objects[i].y + objects[i].text_y); 
            }

            if(objects[i].type == 'text'){
                context.fillStyle = objects[i].color
                context.font = objects[i].text_font;
                context.fillText(objects[i].text, objects[i].x, objects[i].y);
            }
            
            if(!!objects[i].field){
                var field = objects[i].field
                for(var m = 0; m < field.length; m++){
                    for(var n = 0; n < field[m].length; n++){
                        if(!!field[m][n]){
                            var current_state = field[m][n].current_state
                            var state_data = field[m][n].states[current_state]
                            context.drawImage(
                                state_data.image,
                                state_data.current_frame * state_data.width / state_data.number_of_frames,
                                0,
                                state_data.width / state_data.number_of_frames,
                                state_data.height,
                                field[m][n].x,
                                field[m][n].y,
                                state_data.width / state_data.number_of_frames,
                                state_data.height,
                            )
                        }
                    }
                }
            }
        }
    }

    function Animation(o){
        var current_state = o.current_state
        if(o.states[current_state].number_of_frames > 1){
            var state_data = o.states[current_state]
            state_data.tickCount += 1;
            
            if (state_data.tickCount > state_data.frame_lenght) {
                state_data.tickCount = 0;
                state_data.current_frame += 1; 
                state_data.current_frame = 
                    state_data.current_frame > state_data.number_of_frames - 1 
                    ? 0 : state_data.current_frame
            }

            o.states[current_state] = state_data
        }
        return o
    }

    //Функция апдейта, которая отвечает за слежением состояния объектов на каждом фрейме
    function Update(objects){
        for(var i=0; i < objects.length; i++){
            if(objects[i].type == 'sprite'){
                var current_state = objects[i].current_state
                objects[i].states[current_state].number_of_frames > 1 
                ? objects[i] = Animation(objects[i])
                : null
                
            }
            if(!!objects[i].field){
                var field = objects[i].field
                for(var m in field){
                    for(var n in field[m]){
                        if(!!field[m][n]){
                            field[m][n].falling()
                            field[m][n] = Animation(field[m][n])
                        }
                    }
                }
            }
            if(objects[i].name == 'timebar_end'){
                objects[i].x = 357 + (bar_scores * bar_speed)
            }
            if(objects[i].name == 'bomb'){
                objects[i].states.clicked.current_frame == objects[i].states.clicked.number_of_frames - 1
                    ? objects.splice(i, 1)
                    : null
            }
            if(objects[i].name == 'cube'){
                objects[i].states.clicked.current_frame == objects[i].states.clicked.number_of_frames - 1
                    ? objects.splice(i, 1)
                    : null
            }
        }
        if(game_scene == 'game_screen'){
            objects[4].text = time
            objects[4].x = 930 - (String(time).length * 28 - 28)
        }
        if(time <= 0 && game_scene == 'game_screen'){
            game_screen.splice(1, 1)
            game_objects = []
            game_scene = 'main_menu'
        }
        if(bar_scores >= level){
            game_screen.splice(1, 1)
            game_objects = []
            game_scene = 'main_menu'
            
        }
        
    }

    //Отслеживание положения мыши на экране
    function getMousePos(canvas, event) {
        var rect = canvas.getBoundingClientRect()
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
    }

    //Проверка попадания курсора мыши внутрь квадрата объекта
    function isInside(pos, rect){
        if(rect.type == 'sprite'){
            rw = rect.states[rect.current_state].width
            rh = rect.states[rect.current_state].height
        } else {
            rw = rect.width
            rh = rect.height
        }
        return pos.x > rect.x && pos.x < rect.x + rw && pos.y < rect.y + rh && pos.y > rect.y
    }

    //Здесь начинается часть, посвященная работе с основным игровым объектом - квадратами.
    //Эта функция находит группы квадратов в том поле, которое мы ей даем. По сути, это простая
    //функция, воплощающая рекурсивный алгоритм поиска Flood fill
    function findGroups(field, x, y, val, checkmap, counter, data, subcounter){
        var subcounter = subcounter || 0
        var results = []
        data = data || []
        if(field[x][y].color == val && !checkmap[x][y]){
            checkmap[x][y] = true
            data.push(field[x][y].id)
            subcounter++
        }
        var buffer
        if(x && !checkmap[x - 1][y] && field[x - 1][y].color == val){
            var buffer = findGroups(field, x - 1, y, val, checkmap, counter, data, subcounter)
        }
        if(x < field.length - 1){
            if(!checkmap[x + 1][y] && field[x + 1][y].color == val){
                var buffer = findGroups(field, x + 1, y, val, checkmap, counter, data, subcounter)
            }
        }
        
        if(y && !checkmap[x][y - 1] && field[x][y - 1].color == val){
            var buffer = findGroups(field, x, y - 1, val, checkmap, counter, data, subcounter)
        }
        if(y < field[0].length - 1){
            if(!checkmap[x][y + 1] && field[x][y + 1].color == val){
                var buffer = findGroups(field, x, y + 1, val, checkmap, counter, data, subcounter)
            }
        }
        results[0] = checkmap
        if(!buffer){
            results[1] = data
        } else {
            results[1] = Object.assign(buffer[1], data)
        }

        return results
        
    }

    //Функция "недоконструктор", которая создает новые объекты квадратов
    function CreateCubes(old_field){
        var field = old_field
        var counter = 0
        var checked_elements = []
        var avialable_combinations = []
        for(var i = 0; i < field_size; i++){
            checked_elements[i] = []
            for(var j = 0; j < field_size; j++){
                if(!field[i][j]){
                    var color_pick = Math.floor(Math.random() * colors.length)
                    field[i][j] = NewElement('cube', counter, colors[color_pick], field_size, i, j)
                } else {
                    field[i][j].id = counter
                }

                counter++
            }
        }
        for(var i = 0; i < field_size; i++){
            for(var j = 0; j < field_size; j++){
                if(!checked_elements[i][j]){
                    var cheking_color = field[i][j].color
                    var groups_response = findGroups(field, i, j, cheking_color, checked_elements)
                    checked_elements = groups_response[0]
                    if(Object.keys(groups_response[1]).length > 1){
                        avialable_combinations.push(groups_response[1]) 
                    }
                }
            }
        }

        var response

        if(!avialable_combinations.length){
            field = field.map(i => i.map(j => j = false))
            response = CreateCubes(field)
        } else {
            response = []
            response.push(avialable_combinations, field)
        }

        return response
    }

    //Функция взрыва бомбы, которая убирает квадраты в радиусе одной клетки от себя
    function BombDetonating(field, m, n){
        field[m][n].x = field[m][n].x - 61
        field[m][n].y = field[m][n].y - 61
        field[m][n].current_state = 'clicked'
        game_objects.push(field[m][n])
        scores = scores + 10
        bar_scores = bar_scores + 10
        field[m][n] = false
        for(var i = m - 1; i < Number(m) + 2; i++){
            for(var j = n - 1; j < Number(n) + 2; j++){
                if(i >= 0 && j >= 0){
                    if(field[i][j].name == 'bomb'){
                        field = BombDetonating(field, i, j)
                    }
                    field[i][j] = false
                    scores = scores + 10
                    bar_scores = bar_scores + 10
                }
            }
        }
        return field
    }

    //Функция проверки причастности квадрата к одной из существующих групп квадратов.
    //Если он хоть в одной группе, то вытирается вся группа квадратов, к которой он был
    //причастен
    function RemoveCubes(combinations, field, id, by_bomb){
        if(by_bomb){
            for(var i in field){
                for(var j in field[i]){
                    if(field[i][j].id == id){
                        field = BombDetonating(field, i, j)
                    }
                }
            }
            return field 
        } else {
            var removing_group
            for(var i in combinations){
                for(var j in combinations[i]){
                    if(combinations[i][j] == id){
                        var removing_group = combinations[i]
                    }
                }
            }
            if(removing_group){
                var counter = 0
                for(var i in field){
                    for(var j in field[i]){
                        for(var m in Object.keys(removing_group)){
                            if(removing_group.length > 5 && field[i][j].id == id){
                                field[i][j] = NewElement('bomb', counter, 'bomb', field_size, i, j)
                            } else if(field[i][j].id == removing_group[m]){
                                field[i][j].current_state = 'clicked'
                                game_objects.push(field[i][j])
                                field[i][j] = false
                                scores = scores + 10
                                bar_scores = bar_scores + 10
                            }
                            counter++
                        }
                    }
                }
            } else {
                return false
            }
            return field
        }
    }

    //Функция смещения квадратов вниз под воздействием "гравитации"
    function ShiftCubes(field){
        for(var i in field){
            for(var j in field[i]){
                var m = i   
                while(m > 0){
                    if(!field[m - 1][j]){
                        field[m - 1][j] = field[m][j]
                        field[m][j] = false
                        field[m - 1][j].dy += 61
                    }
                    m--
                }
                
            }
        }
        return field
    }

    //Функция создания нового элемента на пустующем месте на поле.
    //Может создать как квадрат, так и бомбу.
    function NewElement(name, counter, color, field_size, i, j){
        if(name == "cube"){
            var new_element = {
                id : counter,
                name : name,
                color: color,
                type : 'sprite',
                current_state : 'whole',
                states : {
                    whole : {
                        image : createSprite('img/' + color + '.png'),
                        number_of_frames : 1,
                        current_frame : 0,
                        width : 61,
                        height : 69,
                    },
                    clicked : {
                        image : createSprite('img/cube_exp.png'),
                        number_of_frames : 17,
                        current_frame : 0,
                        frame_lenght : 2,
                        frame_tick : 1,
                        tickCount : 0,
                        width : 1037,
                        height : 61,
                    }
                },
                a : 0 - i,
                x : 61 * (field_size - j - 1) + 60,
                y: 90,
                dy : 61 * (field_size - i - 1) + 200,
                grid_x : i,
                grid_y : j,
                clickActionDown(...args){
                    return
                },
                clickActionUp(combinations, field){
                    var removed_playfield = RemoveCubes(combinations, field, this.id)
                    if(removed_playfield){
                        var shifted_playfield = ShiftCubes(removed_playfield)
                        var new_field = CreateCubes(shifted_playfield)
                        var response = []
                        response.push(new_field[0], new_field[1])
                        return response
                    } else {
                        this.current_state == 'clicked' ? null : this.current_state = 'whole'
                        return
                    }    
                }
            }
        }

        if(name == 'bomb'){
            var new_element = {
                id : counter,
                name : name,
                color: color,
                type : 'sprite',
                current_state : 'whole',
                states : {
                    whole : {
                        image : createSprite('img/' + color + '.png'),
                        number_of_frames : 1,
                        current_frame : 0,
                        width : 61,
                        height : 69,
                    },
                    clicked : {
                        image : createSprite('img/' + color + '_exp.png'),
                        number_of_frames : 17,
                        current_frame : 0,
                        frame_lenght : 2,
                        frame_tick : 1,
                        tickCount : 0,
                        width : 3111,
                        height : 183,
                    }
                },
                a : 0 - i,
                x : 61 * (field_size - j - 1) + 60,
                y: 61 * (field_size - i - 1) + 200,
                dy : 61 * (field_size - i - 1) + 200,
                grid_x : i,
                grid_y : j,
            
                clickActionDown(...args){
                    return
                },
                clickActionUp(combinations, field){
                    var removed_playfield = RemoveCubes(combinations, field, this.id, true)
                    if(removed_playfield){
                        var shifted_playfield = ShiftCubes(removed_playfield)
                        var new_field = CreateCubes(shifted_playfield)
                        var response = []
                        response.push(new_field[0], new_field[1])
                        return response
                    } else {
                        return
                    }    
                }
            }
        }

        new_element.falling = function(){
            if(this.y < this.dy){
                this.a = this.a < 0 ? 0 : this.a
                this.a++
                this.y += this.a
            } else {
                this.a = 0
                this.y = this.dy
            }
        }

        return new_element
    }

    //Дальше идут лисенеры нажатия и отжатия кнопки мыши и их реакция на то,
    //на что нажал пользователь
    canvas.addEventListener('mousedown', function(e) {
        var mousePos = getMousePos(canvas, e)
        for(var i = 0; i < game_objects.length; i++){
            if(game_objects[i] instanceof Array){
                for(var j = 0; j < game_objects[i].length; j++){
                    if(isInside(mousePos, game_objects[i][j])){
                        game_objects[i][j].clickActionDown(false)
                    }
                }
            } else {
                if(isInside(mousePos, game_objects[i])){
                    game_objects[i].clickActionDown(false)
                }
            }
        }
        
    }, false)

    canvas.addEventListener('mouseup', function(e) {
        var mousePos = getMousePos(canvas, e)
        for(var i = 0; i < game_objects.length; i++){
            if(!!game_objects[i].field){
                var field = game_objects[i].field
                for(var m = 0; m < field.length; m++){
                    for(var n = 0; n < field[m].length; n++){
                        if(isInside(mousePos, field[m][n])){
                            var response = field[m][n].clickActionUp(avialable_combinations, field)
                            if(response){
                                avialable_combinations = response[0]
                                var new_field = {
                                    field : response[1]
                                }
                                game_objects.splice(1, 1, new_field)
                                game_objects[3].text = scores
                                game_objects[3].x = 950 - (String(scores).length * 17 - 17)
                                time--
                                game_objects[4].text = time
                                game_objects[4].x = 930 - (String(time).length * 28 - 28)
                            }
                        }
                    }
                }
            } else {
                if(isInside(mousePos, game_objects[i])){
                    game_objects[i].clickActionUp(true)
                } else {
                    game_objects[i].clickActionUp(false)
                }
            }
        }
        
    }, false)

    canvas.addEventListener('mousemove', function(e) {
        var mousePos = getMousePos(canvas, e)
        for(var i = 0; i < game_objects.length; i++){
            if(!!game_objects[i].field){
                var field = game_objects[i].field
                for(var m = 0; m < field.length; m++){
                    for(var n = 0; n < field[m].length; n++){
                        if(isInside(mousePos, field[m][n])){
                        }
                    }
                }
            } else {
                if(isInside(mousePos, game_objects[i])){
                }
            }
        }
        
    }, false)

    //Грубое, но заранее заложенное описание основных сцен в виде массива объектов,
    //которые те содержат.
    main_menu[0] = {
        name : 'bg',
        type : 'static_sprite',
        current_state : 'whole',
        states : {
            whole : {
                image : createSprite('img/bg_mm.png'),
                number_of_frames : 1,
                current_frame : 0,
                width : 1240,
                height : 877,
            },
        },
        x : 0,
        y : 0,
        clickActionDown(...args){
            return
        },
        clickActionUp(...args){
            return
        },
    }

    main_menu[1] = {
        name: 'button',
        type : 'rect',
        width : 400,
        height : 100,
        x : canvas.width / 2 - 200,
        y : canvas.height / 2 - 100,
        color: '#aa0000',
        clickActionDown(...args){
            this.color = '#00aa00'
        },
        clickActionUp(...args){
            if(args[0]){
                bar_scores = 0
                scores = 0
                level = 1200
                time = 30
                this.color = '#aa0000'
                playfield = []
                game_objects = []
                game_scene = 'game_screen'
            }
            if(!args[0]){
                this.color = '#aa0000'
            }
        },
        text_font: '50px Marvin',
        text: 'Start',
        text_x: 140,
        text_y: 65
    } 

    main_menu[2] = {
        name: 'scores',
        type : 'text',
        width : 0,
        height : 0,
        x : canvas.width / 2 - 250,
        y : 500,
        color: 'white',
        clickActionDown(...args){
            return
        },
        clickActionUp(...args){
            return
        },
        text_font: '50px Marvin',
        text: ''
    } 

    game_screen[0] = {
        name : 'bg',
        type : 'sprite',
        current_state : 'whole',
        states : {
            whole : {
                image : createSprite('img/bg.png'),
                number_of_frames : 1,
                current_frame : 0,
                width : 1240,
                height : 877,
            },
        },
        clickActionDown(...args){
            return
        },
        clickActionUp(...args){
            return
        },
        x : 0,
        y : 0,
    } 

    game_screen[1] = {
        name: 'bg',
        type : 'rect',
        x : 0,
        y : 0,
        width : 0,
        height : 0,
        color: '#a1a1a1',
        clickActionDown(...args){
            return
        },
        clickActionUp(...args){
            return
        },
    } 

    game_screen[2] = {
        name: 'scores',
        type : 'text',
        width : 0,
        height : 0,
        x : 950,
        y : 500,
        color: 'white',
        clickActionDown(...args){
            return
        },
        clickActionUp(...args){
            return
        },
        text_font: '50px Marvin',
        text: scores
    } 

    game_screen[3] = {
        name: 'time',
        type : 'text',
        width : 0,
        height : 0,
        x : 930 - (String(time).length * 28 - 28),
        y : 340,
        color: 'white',
        clickActionDown(...args){
            return
        },
        clickActionUp(...args){
            return
        },
        text_font: '100px Marvin',
        text: time
    } 

    game_screen[4] = {
        name : 'timebar_start',
        type : 'sprite',
        current_state : 'whole',
        states : {
            whole : {
                image : createSprite('img/time_bar_start.png'),
                number_of_frames : 1,
                current_frame : 0,
                width : 13,
                height : 30,
            },
        },
        x : 344,
        y : 41,
        clickActionDown(...args){
            return
        },
        clickActionUp(...args){
            return
        },
    } 

    game_screen[5] = {
        name : 'timebar_mid',
        type : 'static_sprite',
        current_state : 'whole',
        states : {
            whole : {
                image : createSprite('img/time_bar_middle.png'),
                number_of_frames : 1,
                current_frame : 0,
                width : bar_scores,
                height : 30,
            },
        },
        x : 357,
        y : 41,
        clickActionDown(...args){
            return
        },
        clickActionUp(...args){
            return
        },
    } 

    game_screen[6] = {
        name : 'timebar_end',
        type : 'sprite',
        current_state : 'whole',
        states : {
            whole : {
                image : createSprite('img/time_bar_end.png'),
                number_of_frames : 1,
                current_frame : 0,
                width : 13,
                height : 30,
            },
        },
        x : 357,
        y : 41,
        clickActionDown(...args){
            return
        },
        clickActionUp(...args){
            return
        },
    } 

    game_screen[7] = {
        name : 'bg',
        type : 'sprite',
        current_state : 'whole',
        states : {
            whole : {
                image : createSprite('img/hat.png'),
                number_of_frames : 1,
                current_frame : 0,
                width : 720,
                height : 103,
            },
        },
        x : 29,
        y : 89,
        clickActionDown(...args){
            return
        },
        clickActionUp(...args){
            return
        },
    } 

    //Функция, которая в идеале должна активироваться лишь при смене сцены, однако
    //Пока она все равно запускается каждый раз по циклу. Но для предотвращения багов,
    //внутри цикла была сделана заглушка, которая позволяет функциям цикла активироваться 
    //лишь при смене цикла
    function changeScene(game_scene){
        switch(game_scene){
            case 'main_menu':
                game_objects = main_menu
                console.log()
                if(scores > 0){
                    if(scores >= level){
                        game_objects[2].x = canvas.width / 2 - 350
                        game_objects[2].text = 'You won! Your scores:' + scores
                    } else {
                        game_objects[2].x = canvas.width / 2 - 250
                        game_objects[2].text = 'You lose! Your scores:' + scores
                    }
                } else {
                    game_objects[2].text = ''
                } 
                bar_scores = 0
                break
            case 'game_screen':
                if(!playfield.length){
                    for(var i = 0; i < field_size; i++){
                        playfield[i] = []
                        for(var j = 0; j < field_size; j++){
                            playfield[i][j] = false
                        }   
                    }
                    var response = CreateCubes(playfield)
                    avialable_combinations = response[0]
                    var field = {
                        field : response[1]
                    }
                    game_screen.splice(1, 0, field)
                    game_screen[3].text = scores
                    game_objects = game_screen
                    
                }
                break
        }
        return game_objects
    }
    
    //Сам игроквой цикл, в котором мы проверяем состояние сцены, ее объектов и прорисовываем
    //ее новый кадр
    function gameLoop(){
        window.requestAnimationFrame(gameLoop)
        !game_objects.length ? game_objects = changeScene(game_scene) : null
        Update(game_objects)
        Draw(game_objects)
    }

    //Активация цикла
    gameLoop()

}
//Активация основной игровой функции
Game()