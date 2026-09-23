"""Wiki Nature 5-inch panels: shared style, dimensional gates, editable SVG/600-dpi PNG."""
from pathlib import Path
import importlib.util,json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import AutoMinorLocator
ref=Path(__file__).resolve().with_name('_figure_common.py')
spec=importlib.util.spec_from_file_location('wiki_figure_reference',ref)
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
plt.rcParams.update({'lines.linewidth':2.5,'lines.markersize':10,'lines.markeredgewidth':0,'axes.grid':False})

def colors(n):return plt.cm.viridis(np.linspace(.85,.1,n))

def save_nature(fig,path,panel_shape=(1,1),extra_height=0,primary_axes=None):
    """Require 5x5-inch allocation per chart and square inner axes; save measured evidence."""
    path=Path(path).with_suffix('');path.parent.mkdir(parents=True,exist_ok=True)
    rows,cols=panel_shape
    expected=np.array([5*cols,5*rows+extra_height],float)
    assert np.allclose(fig.get_size_inches(),expected,rtol=0,atol=1e-8)
    axes=primary_axes if primary_axes is not None else fig.axes
    for ax in axes:
        assert ax.axison,'Use separate geometry-preserving diagram export for non-chart panels'
        assert not ax.get_title(),'Put prose titles in the Markdown caption'
        ax.set_box_aspect(1)
        ax.grid(False)
        for spine in ax.spines.values():spine.set_visible(True)
        ax.tick_params(which='both',direction='in',top=True,right=True)
        if ax.get_xscale()=='linear':ax.xaxis.set_minor_locator(AutoMinorLocator(2))
        if ax.get_yscale()=='linear':ax.yaxis.set_minor_locator(AutoMinorLocator(2))
    fig.tight_layout(pad=.5,rect=(0,extra_height/expected[1],1,1))
    fig.canvas.draw()
    problems=module.figcheck(fig)
    for legend in fig.legends:
        bb=legend.get_window_extent(fig.canvas.get_renderer());fb=fig.bbox
        if bb.x0<fb.x0 or bb.y0<fb.y0 or bb.x1>fb.x1 or bb.y1>fb.y1:problems.append('Shared legend outside canvas')
    if problems:raise ValueError(problems)
    measurements=[]
    for ax in axes:
        bb=ax.get_window_extent().transformed(fig.dpi_scale_trans.inverted())
        ratio=bb.width/bb.height
        assert abs(ratio-1)<=.01,(path,ratio)
        measurements.append({'width_in':bb.width,'height_in':bb.height,'ratio':ratio})
    fig.savefig(path.with_suffix('.svg'))
    fig.savefig(path.with_suffix('.png'),dpi=600)
    from PIL import Image
    with Image.open(path.with_suffix('.png')) as im:
        assert tuple(im.size)==tuple(np.round(expected*600).astype(int)),im.size
        pixels=list(im.size)
    report={'style':'Nature 5in','panel_allocation_in':[5,5],'panel_shape':list(panel_shape),'canvas_in':list(expected),'png_dpi':600,'png_pixels':pixels,'svg_editable_text':True,'primary_axes':measurements,'figcheck_problems':problems}
    path.with_suffix('.figure-check.json').write_text(json.dumps(report,indent=2)+'\n')
    plt.close(fig)
    return report
