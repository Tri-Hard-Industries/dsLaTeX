# dsLaTeX

Renders `$...$` and `$$...$$` in raw Python function, method, and class docstrings on hover.

```python
def area(r):
    r"""Area: $\pi r^2$."""
```

To hide the raw docstring in the standard hover:

```python
def area(r):
    r"""<!--dslatex
    Area: $\pi r^2$.
    -->"""
```

Requires a Python definition provider such as Pylance.


**Examples**: 

See some link


**How to install** : 


Download the vsix binary [file](https://github.com/Tri-Hard-Industries/dsLaTex/blob/main/dslatex/dslatex-0.0.1.vsix)
