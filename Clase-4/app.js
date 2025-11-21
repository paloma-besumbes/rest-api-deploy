
//REST API
//REST: Representational State Transfer (Es una arquitectura de software)
//Se ha usado sobre todo para comunicaciones en redes y para construir APIs.

//Toda arquitectura de software tiene como fin crear algo que se pueda sostener en el tiempo de la mejor forma posible...
//... simplificando al máximo el desarrollo de esa pieza de software. 

//- Principios de REST: Simplicidad, Escalabilidad, Portabilidad, Fiabilidad, Visibilidad, Fácil de modificar.

//- Fundamentos de REST: Recursos, Verbos HTTP, Representaciones, Stateless
// Recursos de REST: En rest, todo es considerado un recurso o una colección de recursos. 
//... Cada recurso se va a identificar con una URL.
// Verbos HTTP: Definen las operaciones que se pueden realizar con los recursos (CRUD).
// Representaciones: El cliente debería poder decidir con qué formato quiere que se representen los recursos (JSON, XML, HTML, etc.)
// Stateless: El cliente debe enviar toda la info necesaria para que el servidor procese la request. El servidor(el backend) no debe tener que guardar ninguna información procedente de la request para poder contestarla o procesarla (Sí podrá enviar los datos pertinentes a una BD).
// Interfaz uniforme: Que la interfaz entre el cliente y el servidor sea consistente y uniforme para todas las interacciones. Las URL tienen que llamarse igual, hacer lo mismo, etc. 
// Separación de conceptos: Los componentes del cliente y del servidor están separados entre sí. Esto permite que cliente y servidor evolucionen de forma separada.



const express = require('express')
const crypto = require('node:crypto') //Node.js tiene una biblioteca nativa para crear ids
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemes/movies.js')

const app = express()
app.use(express.json()) //Middleware automático de express

app.disable('x-powered-by')

//Las APIs tienen distintas URLs a las que podemos llamar para extraer información. 
//Endpoint: Es un path (una ruta) en la que tenemos un recurso. 


//- ERROR DE CORS en el navegador = Cuando una url (ej: localhost:8080) intenta acceder a la información de otra (ej: misrecetas.com)...
//... el navegador revisa que la api haya dado permiso a dicha url cliente para ver su información
//... concretamente, se fija en la cabecera 'Access-Control-Allow-Origin'
// Esto se puede solucionar importando un middleware automático: npm install cors -E (app.use(cors))
//... El problema es que crea cabeceras automáticas en las que da permiso a todos los orígenes(*), lo suyo sería personalizar este middleware. 
// SOLUCIÓN si queremos permitir el acceso a varios orígenes.
const ACCEPTED_ORIGINS = [
    'http://localhost:8080', // Posibles clientes...
    'http://localhost:1234',
    'http://localhost:54293',
    'http://movies.com', //Los de producción...
    'http://palomab.dev', //A esta chica tan simpática...

]

//Métodos normales: GET/HEAD/POST
//Métodos complejos: PUT/PATCH/DELETE

//CORS PRE-Fligth: 
//Los métodos complejos, antes de hacer la acción que correspondan, preguntan por OPTIONS (¿Qué se me permite hacer?)


//Todos los recursos que sean MOVIES se identifican con /movies (Esta es la URL)
//Este es el Endpoint para el primer GET.
app.get('/movies', (req, res) => {

    const origin = req.header('origin')
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) { // Incluimos también el caso de que no exista origen, porque cuando hacemos la petición desde la misma url de la API, la request no incluye el origin (tampoco da error de CORS porque es absurdo)
        res.header('Access-Control-Allow-Origin', origin) //  Si escribimos '*' en el origen = Todos los orígenes están permitidos. También podemos especificar la url(dominio y puerto) a la que permitimos que se envíe info de nuestra api. 

    }


    const { genre } = req.query //En la query(búsqueda),que viene con la request, tenemos un objeto en donde ya están transformados todos los 'query params' en un objeto. Esto es un recurso muy útil que podemos usar gracias a express. 
    if (genre) {  //Si en la request se preunta por el género...
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )
        return res.json(filteredMovies)

    }
    res.json(movies)

})


//Path-to-regexp: Biblioteca popularizada por express que convierte estos path en expresiones regulares(regex).
//El programador ve algo sencillo de entender, pero por debajo hay una fórmula mucho más compleja(parece chino) 
//No es obligatorio usar path-to-regex en las rutas, pero existe la posibilidad. 
//No es recomendable crear regex (no path-to-regex) manualmente, porque da problemas de rendimiento. 

//:id = Segmento dinámico que más tarde podremos recuperar. 
// Netxt.js usa esto por debajo.
// Este es el segundo Endpoint, para recuperar una película. 

app.get('/movies/:id', (req, res) => {  //Se pueden poner más '/:mas/:otro'...
    const { id } = req.params  // De la request, sácame de entre sus parámetros el valor del parámetro 'id'.
    const movie = movies.find(movie => movie.id === id) //movie.id(id de la película) === id(que pide la request)
    if (movie) return res.json(movie)

    res.status(404).json({ message: 'Movie not found' })

})


app.post('/movies', (req, res) => {

    //Usamos la función que creamos en movies.js para validar los datos de cada apartado.     
    const result = validateMovie(req.body) //Podemos acceder al body gracias al middleware que hicimos con express. 


    if (!result.success) {
        // Muestra los detalles del error correctamente
        return res.status(400).json({
            error: result.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message
            }))
        })
    }


    // En Base de Datos
    const newMovie = {
        id: crypto.randomUUID(), //Generamos un id (uu id = Identificador único universal, version 4) aleatorio gracias a la biblioteca crypto de node. 
        ...result.data //Esto solo debe hacerse si hemos validado previamente los datos que se van a introducir. Por eso no es igual este 'data' que el req.body a pelo.
    }
    //Esto no sería REST, porque estamos guardando el estado de la app en memoria. Si añadimos una película y reiniciamos el servidor esa película desaparece porque están almacenadas solo en RAM.  
    // Una API real guardaría la película en una base de datos o reescribiría el archivo JSON. 

    movies.push(newMovie)


    res.status(201).json(newMovie) //Para actualizar la caché del cliente


})


app.delete('/movies/:id', (req, res) => {


    const origin = req.header('origin')
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) { // Incluimos también el caso de que no exista origen, porque cuando hacemos la petición desde la misma url de la API, la request no incluye el origin (tampoco da error de CORS porque es absurdo)
        res.header('Access-Control-Allow-Origin', origin) //  Si escribimos '*' en el origen = Todos los orígenes están permitidos. También podemos especificar la url(dominio y puerto) desde la que permitimos que se envíe info de nuestra api. 

    }

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' })
    }

    movies.splice(movieIndex, 1) //Eliminamos una película a partir del índice de la misma
    return res.json({ message: 'Movie deleted' })
})


app.patch('/movies/:id', (req, res) => {
    const { id } = req.params
    const result = validatePartialMovie(req.body)
    const movieIndex = movies.findIndex(movie => movie.id === id)


    if (!result.success) {
        // Muestra los detalles del error correctamente
        return res.status(400).json({
            error: result.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message
            }))
        })
    }

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' })
    }

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie

    return res.json(updateMovie)


})


app.options('/movies/:id', (req, res) => {

    const origin = req.header('origin')
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) { // Incluimos también el caso de que no exista origen, porque cuando hacemos la petición desde la misma url de la API, la request no incluye el origin (tampoco da error de CORS porque es absurdo)
        res.header('Access-Control-Allow-Origin', origin) //  Si escribimos '*' en el origen = Todos los orígenes están permitidos. También podemos especificar la url(dominio y puerto) desde la que permitimos que se envíe info de nuestra api. 
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    }

    res.send(200)

})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
})