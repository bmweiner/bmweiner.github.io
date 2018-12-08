---
layout: post
title:  "Front-end Web Development with Python"
date:   2018-12-07 10:00:00 -0400
image: "/assets/images/binary_converter_sm.png"
category: computer science
tags: [python, web, binary, conversion]
---
[Brython](https://brython.info/) is a transcompiler which converts python code to javascript. This means you can use python logic in place of javascript when building a website. I created a simple app using Github pages to test this out.

The app, [Binary Converter](https://bmweiner.com/binary_converter/), is a conversion tool with a simple user interface. It allows the user to enter an input value in one of the following formats: unsigned (binary, decimal or hexadecimal), IEEE 754 single, IEEE 754 double, one's complement, or two's complement. This value is converted to each of the other formats. There is also an error handler which checks for invalid input formats and instructs the user to correct any issues.

[![binary_converter](/assets/images/binary_converter.png){:class="post-img"}](https://bmweiner.com/binary_converter/)

The [underlying python code](https://github.com/bmweiner/binary_converter/blob/master/binary_converter.py) performs all conversions and validates the input value. There is a single conversion function which converts the input value. Conversion supports fractional and negative values. The python script is referenced within the HTML script tag and converted in real-time.

![brython_script](/assets/images/brython_script.png){:class="post-img"}

This approach is a trade-off between convenience and speed. Some python packages may not work well if their transcompilation yields a high expansion factor. All conversion is done when the web page is loaded. For example, the built in re package was noticeably slow, so I used javascript to process regex.
