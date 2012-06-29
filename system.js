//-------------------------------------------------------------------------
//	BEGIN String Extensions
//-------------------------------------------------------------------------
	
	// Static extensions to the built-in string object	
	String.empty = '';
	String.isNullOrEmpty = function(string) {
		///<summary>Returns true if the passed string (object) is null or empty (otherwise, false)</summary>

		var returnValue = false;
		
		if (string == null || string == String.empty)
		{
			returnValue = true;
		}
		return returnValue;
		
	}; //String.isNullOrEmpty

	// Removes whitespace characters from end of the string
	String.prototype.lTrim = function()
	{
		return this.replace(/^\s*/,"");
	};
	
	// Removes whitespace characters from end of the string
	String.prototype.rTrim = function()
	{
		return this.replace(/\s*$/,"");
	};
	
	// Equivalent to VBScript Trim()
	// - removes whitespace characters from the beginning and end of the string
	String.prototype.trim = function()
	{
		return this.rTrim().lTrim();
	};
	
	String.prototype.endsWith = function(b)
	{
		return this.substr(this.length-b.length) == b;
	};
	
	String.prototype.startsWith = function(c)
	{
		return this.substr(0,c.length) == c;
	};
	
	String.prototype.padLeft = function(totalWidth, paddingChar)
	{
		if(!isNumber(totalWidth))
		{
			throw "totalWidth must be a number;"
		}
		
		if(!isString(paddingChar))
		{
			throw "paddingChar must be a string;"
		}
	
		var s = this;
		while(s.length < totalWidth)
		{
			s = String.format("{0}{1}",paddingChar,s);
		}
		return s;
	};
	
	String.prototype.padRight = function(totalWidth, paddingChar)
	{
		if(!isNumber(totalWidth))
		{
			throw "totalWidth must be a number;"
		}
		
		if(!isString(paddingChar))
		{
			throw "paddingChar must be a string;"
		}
		
		var s = this;
		while(s.length < totalWidth)
		{
			s = String.format("{0}{1}",s,paddingChar);
		}
		return s;
	};
	
	String.format = function(format, args)
	{
		var s=format;
		for(var i=0;i<arguments.length;i++)
		{
			// search for tokens in the form {i} (e.g. {0}) - "g" indicates global search
			find = new RegExp("\\{"+i+"\}","g");
			s=s.replace(find,arguments[i+1]);
		}
		return s;
	};

	String.prototype.format = function(args)
	{
		var s = this;
		for(var i=0;i<arguments.length;i++)
		{
			// search for tokens in the form {i} (e.g. {0}) - "g" indicates global search
			find = new RegExp("\\{"+i+"\}","g");
			s = s.replace(find,arguments[i]);
		}
		return s;
	};

	String.prototype.expand = function(model) {
		var s = this;
		for(prop in model)
		{
			// search for tokens in the form {i} (e.g. {0}) - "g" indicates global search
			find = new RegExp("\\{"+prop+"\}","g");
			s = s.replace(find,model[prop]);
		}
		return s;
	};
	
	// Capitalizes first character of every word
	// makes all other characters lower case
	String.prototype.toProperCase = function()
	{
		s = this.toLowerCase();
		var parts = s.split(" ");
		for(var i=0;i<parts.length;i++)
		{
			parts[i] = parts[i].substr(0,1).toUpperCase() + parts[i].substr(1);
		}
		s = parts.join(" ");
		return s;
	};
	
	// Equivalent to .NET StringBuilder
	StringBuilder = function(e)
	{
		var arrParts=new Array();
		
		this.append=function(g)
		{
			if(!(g==null||typeof g=="undefined"||typeof g=="string"&&g.length==0))
			{
				arrParts.push(g);
			}
		};
		
		this.appendLine=function(h)
		{
			this.append(h);
			arrParts.push("\r\n");
		};
		
		this.clear=function()
		{
			arrParts.clear();
		};
		
		this.isEmpty=function()
		{
			return arrParts.length==0;
		};
		
		this.toString=function()
		{
			return arrParts.join("");
		};
		
		this.length=function()
		{
			return arrParts.toString().length;
		};
		
		this.append(e);
		
		return this;
	}; //StringBuilder
	
//-------------------------------------------------------------------------
//	END String Extensions
//-------------------------------------------------------------------------



//-------------------------------------------------------------------------
//	BEGIN Array Extensions
//-------------------------------------------------------------------------
	
	// Returns the zero-based index of the first occurrence of the specified object/value
	Array.prototype.indexOf = function(object)
	{
		for(var i=0;i<this.length;i++)
		{
			if (this[i] == object)
			{
				return i;
				break;
			}
		}
		return -1;
	}
	
	// Determines whether the Array contains a specified object/value
	Array.prototype.contains = function(object)
	{
		return this.indexOf(object)!=-1;
	}
	
	// Empties the Array
	Array.prototype.clear = function()
	{
		this.length = 0;
		return this;
	}
	
	// Used to insert specified object/value at specified index
	Array.prototype.insert = function(index,object)
	{
		this.splice(index,0,object);
		return this;
	}
	
	// Adds the specified items to the end of the Array
	Array.prototype.addRange = function(values)
	{
		for(var i=0;i<arguments.length;i++)
		{
			this.push(arguments[i]);
		}
		return this;
	}
	
	// Used to remove item from the Array at the specified index
	Array.prototype.remove = function(object)
	{
		var i=this.indexOf(object);
		if(i>-1)
      {
			this.splice(i,1);
		}
		return i>-1;
	}
	
	// Used to remove specified object/value from the Array
	Array.prototype.removeAt = function(index)
	{
		return this.splice(index,1);
   }
   
   Array.prototype.add = function(object)
   {
		return this.push(object);
   }
	
//-------------------------------------------------------------------------
//	END Array Extensions
//-------------------------------------------------------------------------



//-------------------------------------------------------------------------
//	BEGIN General Helper Extensions
//-------------------------------------------------------------------------
		
	function isAlien(a)
	{
		return isObject(a) && typeof a.constructor != 'function';
	}
	
	function isArray(a)
	{
		return isObject(a) && a.constructor == Array;
	}
	
	function isBoolean(a)
	{
		return typeof a == 'boolean';
	}
	
	function isEmpty(o)
	{
		var i, v;
		if (isObject(o))
		{
			for (i in o)
			{
				v = o[i];
				if (isUndefined(v) && isFunction(v))
				{
					return false;
				}
			}
		}
		return true;
	}
	
	function isFunction(a)
	{
		return typeof a == 'function';
	}
	
	function isNull(a)
	{
		return typeof a == 'object' && !a;
	}
	
	function isNumber(a)
	{
		return typeof a == 'number' && isFinite(a);
	}
	
	function isObject(a)
	{
		return (a && typeof a == 'object') || isFunction(a);
	}
	
	function isString(a)
	{
		return typeof a == 'string';
	}
	
	function isUndefined(a)
	{
		return typeof a == 'undefined';
	}


//-------------------------------------------------------------------------
//	END General Helper Extensions
//-------------------------------------------------------------------------