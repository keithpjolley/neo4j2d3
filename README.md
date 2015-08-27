# neo4j2d3
import data from neo4j into d3 (or more generally into javascript)


i created and shared this to document how i got data from neo4j into javascript
and then into d3.

some of it is specific to my case - but really the only thing that should change is
how the hierarchy is defined. the slick way to do this would be to use the links info
that neo4j returns but my data had specific info embedded into it.  each node has
an "empno" (employee id), and a "manager_empno" (manager id). my root data has the
root node with manager_empno = 0. somewhere in d3 it expects manager_empno to be null.

anyways, figuring out how to get the data into javascript using the ajax call was not
all that easy. there's a big difference in how you call neo4j if you use POST or GET.

The data you get back is not at all how d3 expects to see it so a little transmorgification
is needed. and some of the d3 demo graphs expect everything to be flat and others as a tree.

both types are done.

here's an example of my data from neo4j:

neo4j-sh (?)$ MATCH path = (n)-[r:Manages*2]->(m) WHERE n.manager_empno=0 RETURN path LIMIT 3;
| path
+-
  [Node[83387]{empno:35596,hire_date:"1991-03-13", name:"Selago, Vladislav",contractor:0,manager_empno:0,depth:0},:Manages[69736]{},
   Node[69738]{empno:14691,hire_date:"1988-08-21",name:"Acieral, Hsuan",contractor:0,manager_empno:35596,depth:1},:Manages[70700]{},
   Node[70702]{empno:16324,hire_date:"1994-11-17",name:"Jabarite, King",contractor:0,manager_empno:14691,depth:2}
  ]
  [Node[83387]{empno:35596,hire_date:"1992-03-02",name:"Selago, Vladislav",contractor:0,manager_empno:0,depth:0},:Manages[69736]{},
   Node[69738]{empno:14691,hire_date:"1989-11-24",name:"Acieral, Hsuan",contractor:0,manager_empno:35596,depth:1},:Manages[83836]{},
   Node[83839]{empno:36115,hire_date:"2009-02-20",name:"Calcispongiae, Rogue",contractor:0,manager_empno:14691,depth:2}
  ]
  [Node[83387]{empno:35596,hire_date:"1999-01-22",name:"Selago, Vladislav",contractor:0,manager_empno:0,depth:0},:Manages[69736]{},
   Node[69738]{empno:14691,hire_date:"2014-07-15",name:"Acieral, Hsuan",contractor:0,manager_empno:35596,depth:1},:Manages[83134]{},
   Node[83136]{empno:35326,hire_date:"2003-03-12",name:"Mimosa, Pat",contractor:0,manager_empno:14691,depth:2}
  ]
+-
3 rows


