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


def normal():
    """
    some text, no nothing
    """


def inline():
    """
    this is some inline without r $\alpha=6$
    """

def inline2():
    r"""
    this is some inline with r $\alpha=6$
    """

def somerandom():
    r"""
    This is one interesting docstring https://nutritionsource.hsph.harvard.edu/food-features/bananas/

    ** note the linewidth **
    
    $\mathcal{B}$ananas and some lengthy text and more and more
    """

some

broken

some_method

normal

inline

inline2

somerandom