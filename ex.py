def some_method():
    r"""This is some function about bananas $\alpha$ and $\beta$.

    The roundness is $\frac{A}{\pi r_e^2}$ which is nice.

    $$\sum^n_{i_1=1} x^{2^{i_1}}_2$$

    $$\begin{cases} x^2 & x > 1 \\ 2 & x < 1 \end{cases}$$
    """
    return 42


def broken():
    """Missing the r prefix, so $\alpha$ will warn."""
    return 0


def some():
    r"""
    $$\text{This is a docstring} \quad
    \sum^N_{i=1} \frac{i}{2}+5 \quad


    \text{some more text and more} \quad
    \alpha = 6$$

    $$\text{more math} \quad k$$
    """
    pass


some

some_method