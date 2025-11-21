const z = require('zod') //Dependencia que nos ayuda a validar el tipo de dato que se introduce para cada variable.


const movieSchema = z.object({
    title: z.string({
        invalid_type_error: 'Movie title must be a string',
        required_error: 'Movie title is required.'
    }),
    year: z.number().int().positive().min(1900).max(2025),
    director: z.string(),
    duration: z.number().int().positive(),
    rate: z.number().min(0).max(10).default(5),
    poster: z.string().url({
        message: 'Poster must be a valid URL'
    }),
    genre: z.array(
        z.enum(['Action', 'Adventure', 'Terror', 'Fantasy', 'Thriller', 'Comedy', 'Children', 'Sci-Fi', 'Drama']),
        {
            required_error: 'Movie genre is required',
            invalid_type_error: 'Movie genre must be an array of enum Genre '
        }
    )
})

function validateMovie(object) {
    return movieSchema.safeParse(object)
}


function validatePartialMovie(object) {
    return movieSchema.partial().safeParse(object) //partial() permite que todos los campos sean opcionales. Recoge los cambios en los campos que queremos y mantiene el resto igual. Lo usamos para actualizaciones parciales de un recurso (PATCH)
}


module.exports = {
    validateMovie,
    validatePartialMovie
}