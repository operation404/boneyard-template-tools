class Template_Tools {

    static init() {
        // Template_Tools.prepare_hook_handlers();
		
		window.Boneyard = window.Boneyard ?? {};
		window.Boneyard.Template_Tools = {
            targeting_types: Template_Tools.targeting_types,
			token_get_templates: Template_Tools.token_get_templates,
			template_get_tokens: Template_Tools.template_get_tokens,
			token_in_template: Template_Tools.token_in_template,
        };
		
        console.log(`====== Boneyard ======\n - Template tools initialized`);
    }

    static prepare_hook_handlers() {}

    static targeting_types = [
        "token_center", // center of token must be inside area
        "any_token_space", // the center of at least one occupied space of token must be inside area
        "token_region", // any point on the token occupied region must be inside area
    ];
	static default_targeting = Template_Tools.targeting_types[1];


	static token_get_templates(token_doc, target_style) {
		return token_doc.parent.templates.filter(template_doc => 
			Template_Tools.token_in_template(token_doc, template_doc, target_style));
	}

	static template_get_tokens(template_doc, target_style) {
		return template_doc.parent.tokens.filter(token_doc => 
			Template_Tools.token_in_template(token_doc, template_doc, target_style));
	}

    static token_in_template(token_doc, template_doc, target_style) {
		if (token_doc.parent.id !== template_doc.parent.id ||
			token_doc.hidden || template_doc.hidden) 
			return false;
		
        const {
            x,
            y
        } = template_doc;

		let temp;
		try {
			temp = Template_Tools.get_token_points(token_doc, target_style);
		} catch (e) {
			console.error(e);
			console.log("Error in calculating token points to test.");
			return false;
		}
        const token_points = temp; // 'token_points' should be array
		temp = undefined;

        let in_template = false;
        token_points.some(p => { // 'some' breaks on true return

            // template_doc.object.shape.contains(testX, testY);
            // testX and testY are offsets from the x,y position of the shape itself
            // so to test a tile directly above the shape, testX = 0, testY = -100
            
			/*
				I'm not sure if there's a reason to test for the center point,
				since that should also be caught by the 'shape.contains' call.
				
			const contains = (p.x === x && p.y === y) || // point equals center
				template_doc.object.shape.contains(p.x - x, p.y - y); // point in shape
			*/
            if (template_doc.object.shape.contains(p.x - x, p.y - y)) {
                in_template = true;
                return true;
            }
        });
        return in_template;
    }

    static get_token_points(token_doc, target_style) {
		switch (target_style ?? Template_Tools.default_targeting) { // don't need breaks due to return
			
			// token_center
			case Template_Tools.targeting_types[0]: 
				return Template_Tools.points_token_center(token_doc);
				
			// any_token_space
			case Template_Tools.targeting_types[1]: 
				return Template_Tools.points_any_token_space(token_doc);
			
			// token_region
			case Template_Tools.targeting_types[2]: 
				return Template_Tools.points_token_region(token_doc);
			
			default:
				throw new Error(`Invalid targeting type: ${target_style}`);
		}
    }

	static points_token_center(token_doc) {
        const { size } = token_doc.parent.dimensions;
		const {
			x,
			y,
			width, // width/height are in grid units, not px
			height
		} = token_doc;
		
		const width_offset = (width / 2) * size;
		const height_offset = (height / 2) * size;
		const point = {
			x: x + width_offset, 
			y: y + height_offset
		};
		
		return [point];
	}
	
	
	/*
		This function is written in such a way that it assumes the token's width
		and height are whole numbers. If this assumption isn't true, this function
		may behave unexpectedly.
		
		This function also assumes the token is properly aligned to the grid. If
		it isn't, the points it calculates will not be the exact centers of grid
		squares.
		
		A better solution would be to calculate a bounding box of grid squares
		around the token, then test if the center of each of those squares overlaps
		with the token's occupied region, and if so add it to the list. I will try
		to implement this solution at a later point.
		
		TODO: implement a more robust solution
	*/
	static points_any_token_space(token_doc) {
        const { size } = token_doc.parent.dimensions;
		const {
			x,
			y,
			width, // width/height are in grid units, not px
			height
		} = token_doc;
		const c_width = Math.ceil(width);
		const c_height = Math.ceil(height);
		
		const points = [];
		for (let h = 0.5; h < c_height; h++) {
			for (let w = 0.5; w < c_width; w++) {
				const offset_x = w * size;
				const offset_y = h * size;
				const point = {
					x: x + offset_x,
					y: y + offset_y
				};
				points.push(point);
			}
		}
		
		return points;
	}

	/*
		This function is written in such a way that it assumes the token's width
		and height are whole numbers. If this assumption isn't true, this function
		may behave unexpectedly.
		
		If the token is aligned to the grid, it calculates the vertices, edge mid-points,
		and centers of all grid squares the token occupies and returns them. It functions 
		the same way if not aligned to the grid, but the points returned won't match to 
		exact grid vertices, edge mid-points, or centers.			
		
		Because this is really just generating multiple points and hoping that they'll
		be inside the template, it's not the most efficient.
		
		This should suffice for 99% of situations, but I know that it is not
		true shape collision detection, so there will be edge case failures. If true
		shape collision is ever implemented, using 'points_any_token_space' will
		be unnecessary.
		
		TODO: implement a more robust solution
		
		If a token is adjacent to a template edge, that token would normally be
		considered inside the template, as a point that is on the edge of the token's
		occupied region would be on the edge of the template, and being on the edge
		is still considered being inside the template.
		
		As a simple workaround, all of the points along the outermost edge of the token's
		occupied region are shifted inwards 1 pixel. This means that rather than just
		sharing an edge, the token must truly overlap with the template to be considered
		inside of it.
	*/
	static points_token_region(token_doc) {
        const { size } = token_doc.parent.dimensions;
		const {
			x,
			y,
			width, // width/height are in grid units, not px
			height
		} = token_doc;
		const c_width = Math.ceil(width);
		const c_height = Math.ceil(height);
		
		/*
			Top points:
			(a) Start with top left point, moved x&y inwards by 1px.
			(b) Do all of the points along the top edge until the top right point,
				move all of the y down 1px.
			(c) Top right point, move y down 1px and x back 1px.
			
			Middle Points:
			(d) Leftmost point of the row, move x 1px right.
			(e) Do all inner points normally.
			(f) Rightmost point of the row, move x 1px left.
			
			Bottom points:
			(g) Bottom left point, move x 1px right, y 1px up.
			(h) Bottom edge points, move y 1px up for each.
			(i) Bottom right point, move x 1px left, y 1px up.
			
			_________      a_b_b_b_c 
			|   |   |      |   |   |
			|   |   |      d e e e f
			|   |   |      |   |   |
			---------  ->  d-e-e-e-f  
			|   |   |      |   |   |
			|   |   |      d e e e f
			|   |   |      |   |   |
			---------      g-h-h-h-i 
		*/
		const points = [];
		let w = 0, h = 0;
		top_row: {
			// a - top left point
			points.push({
				x: x + 1,
				y: y + 1
			});
			
			// b - top middle points
			for (w = 0.5; w < c_width; w+=0.5) {
				points.push({
					x: x + (w * size),
					y: y + 1
				});
			}
			
			// c - top right point
			points.push({
				x: x + (w * size) - 1,
				y: y + 1
			});
		}
		
		w = 0;
		body: {
			for (h = 0.5; h < c_height; h+=0.5) {
				// d - left edge points
				points.push({
					x: x + (w * size) + 1,
					y: y + (h * size)
				});
				
				// e - all inner points
				for (w = 0.5; w < c_width; w+=0.5) {
					points.push({
						x: x + (w * size),
						y: y + (h * size)
					});
				}
				
				// f - right edge points
				points.push({
					x: x + (w * size) - 1,
					y: y + (h * size)
				});
			}
		}
		
		w = 0;
		bottom_row: {
			// g - bottom left point
			points.push({
				x: x + 1,
				y: y + (h * size) - 1
			});
			
			// h - bottom middle points
			for (w = 0.5; w < c_width; w+=0.5) {
				points.push({
					x: x + (w * size),
					y: y + (h * size) - 1
				});
			}
			
			// i - bottom right point
			points.push({
				x: x + (w * size) - 1,
				y: y + (h * size) - 1
			});
		}

		return points;
	}

}

Template_Tools.init();

















































